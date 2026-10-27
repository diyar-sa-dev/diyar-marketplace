<?php

namespace Tests\Feature\Api\V1\Shipping;

use App\Domains\Shipping\DTO\CarrierQuoteRequest;
use App\Domains\Shipping\Gateways\AyMakanCarrierGateway;
use App\Domains\Shipping\Gateways\MockCarrierGateway;
use App\Domains\Shipping\Services\CarrierBookingOrchestrationService;
use App\Domains\Shipping\Services\CarrierGatewayManager;
use App\Enums\RoleName;
use App\Enums\ShipmentStatus;
use App\Models\Address;
use App\Models\CarrierConfiguration;
use App\Models\CarrierShipment;
use App\Models\Product;
use App\Models\Shipment;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorOrder;
use App\Models\VendorPickupAddress;
use App\Models\VendorShippingSettings;
use Database\Seeders\AdminPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ShippingV2CarrierIntegrationTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithFinance, InteractsWithIdentity, RefreshDatabase;

    private User $adminUser;

    private User $vendorUser;

    private VendorAccount $vendorAccount;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminPermissionSeeder::class);
        $this->seedCommissionRules();

        $this->adminUser = $this->createUserWithRole(RoleName::Admin);
        $this->vendorUser = $this->createUserWithRole(RoleName::Vendor);
        $this->vendorAccount = $this->vendorUser->vendorAccount;

        VendorShippingSettings::query()->firstOrCreate(
            ['vendor_account_id' => $this->vendorAccount->id],
            [
                'carrier_enabled' => true,
                'carrier_flat_rate' => '30.00',
                'carrier_free_shipping_enabled' => true,
                'carrier_free_shipping_threshold' => '500.00',
                'pickup_enabled' => true,
                'pickup_location_label' => 'Riyadh Showroom',
                'allowed_by_admin' => true,
                'carrier_api_enabled' => true,
                'selected_carrier_code' => 'mock',
            ]
        );
    }

    public function test_mock_gateway_provides_tiered_quote(): void
    {
        $gateway = new MockCarrierGateway;
        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer, ['city' => 'Riyadh']);

        $request = new CarrierQuoteRequest(
            originAddress: null,
            destinationAddress: $address,
            billableWeightKg: 4.0,
            declaredValue: 150.0,
        );

        $response = $gateway->getQuote($request);

        $this->assertTrue($response->isAvailable);
        // Base 20.00 + (3.0 * 2.50) = 27.50
        $this->assertSame('27.50', $response->quotedRate);
        $this->assertSame('MOCK-EXPRESS', $response->carrierServiceCode);
    }

    public function test_aymakan_gateway_enforces_furniture_parcel_weight_limit(): void
    {
        $gateway = new AyMakanCarrierGateway('test-token', true);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer, ['city' => 'Jeddah']);

        // 65kg dining table exceeds 15kg AyMakan parcel limit
        $request = new CarrierQuoteRequest(
            originAddress: null,
            destinationAddress: $address,
            billableWeightKg: 65.0,
            declaredValue: 2500.0,
        );

        $response = $gateway->getQuote($request);

        $this->assertFalse($response->isAvailable);
        $this->assertStringContainsString('caps at 15kg', $response->errorReason);
    }

    public function test_vendor_can_create_pickup_origin_address(): void
    {
        $response = $this->actingAs($this->vendorUser)
            ->postJson('/api/v1/dashboard/vendor/pickup-addresses', [
                'contact_name' => 'Fahad Al-Otaibi',
                'contact_phone' => '+966512345678',
                'city' => 'Riyadh',
                'district' => 'Al-Sulaimaniyah',
                'street' => 'King Abdulaziz Road',
                'building_number' => '4021',
                'postal_code' => '12243',
                'national_short_address' => 'RRRD2929',
                'is_default' => true,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('vendor_pickup_addresses', [
            'vendor_account_id' => $this->vendorAccount->id,
            'national_short_address' => 'RRRD2929',
            'is_default' => true,
        ]);
    }

    public function test_booking_orchestration_books_carrier_and_advances_shipment_to_shipped(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create([
            'vendor_account_id' => $this->vendorAccount->id,
            'sale_price' => 150.00,
        ]);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $orderId = $this->postJsonAsUser('/api/v1/orders', $customer, $this->checkoutPayload($address, $product), [
            'Idempotency-Key' => (string) str()->uuid(),
        ])->assertCreated()->json('data.order.id');

        $vendorOrder = VendorOrder::query()->where('order_id', $orderId)->firstOrFail();
        $vendorOrder->update(['status' => 'processing']);
        $shipment = $vendorOrder->shipment;
        $shipment->update(['status' => ShipmentStatus::Prepared]);

        $orchestrator = app(CarrierBookingOrchestrationService::class);
        $carrierShipment = $orchestrator->book($vendorOrder, 'mock');

        $this->assertSame('confirmed', $carrierShipment->booking_status);
        $this->assertNotNull($carrierShipment->tracking_number);
        $this->assertNotNull($carrierShipment->external_shipment_id);

        $this->assertDatabaseHas('shipments', [
            'id' => $shipment->id,
            'status' => ShipmentStatus::Shipped->value,
            'tracking_number' => $carrierShipment->tracking_number,
        ]);

        $this->assertDatabaseHas('vendor_orders', [
            'id' => $vendorOrder->id,
            'status' => 'shipped',
        ]);
    }

    public function test_booking_timeout_is_handled_safely_as_unknown_outcome_without_blind_retry(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create([
            'vendor_account_id' => $this->vendorAccount->id,
            'sale_price' => 150.00,
        ]);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $orderId = $this->postJsonAsUser('/api/v1/orders', $customer, $this->checkoutPayload($address, $product), [
            'Idempotency-Key' => (string) str()->uuid(),
        ])->assertCreated()->json('data.order.id');

        $vendorOrder = VendorOrder::query()->where('order_id', $orderId)->firstOrFail();
        $vendorOrder->update(['status' => 'processing']);
        $shipment = $vendorOrder->shipment;
        $shipment->update(['status' => ShipmentStatus::Prepared]);

        // Configure mock gateway to simulate timeout
        $mockGateway = new MockCarrierGateway;
        $mockGateway->setShouldTimeoutBooking(true);

        $this->app->instance(CarrierGatewayInterface::class, $mockGateway);
        $manager = app(CarrierGatewayManager::class);
        $manager->registerGateway($mockGateway);
        $this->app->instance(CarrierGatewayManager::class, $manager);

        $orchestrator = app(CarrierBookingOrchestrationService::class);
        $carrierShipment = $orchestrator->book($vendorOrder, 'mock');

        $this->assertSame('unknown_outcome', $carrierShipment->booking_status);
        $this->assertDatabaseHas('carrier_booking_attempts', [
            'carrier_shipment_id' => $carrierShipment->id,
            'status' => 'timeout',
        ]);
    }

    public function test_admin_can_toggle_carrier_integration_and_store_encrypted_credentials(): void
    {
        $this->actingAsAdmin($this->adminUser);

        $response = $this->putJson('/api/v1/admin/shipping/carrier-integrations/aymakan', [
            'is_active' => true,
            'is_sandbox' => true,
            'api_token' => 'sec_live_tok_998877665544332211',
            'webhook_secret' => 'whsec_secret_hash_key',
        ]);

        $response->assertStatus(200);

        $config = CarrierConfiguration::query()->where('carrier_code', 'aymakan')->firstOrFail();
        $this->assertTrue($config->is_active);
        $this->assertTrue($config->is_sandbox);

        // Verify decrypted accessor matches original secret
        $this->assertSame('sec_live_tok_998877665544332211', $config->api_token_encrypted);

        // Verify raw database column does not leak plaintext secret
        $rawRow = \DB::table('carrier_configurations')->where('carrier_code', 'aymakan')->first();
        $this->assertNotEquals('sec_live_tok_998877665544332211', $rawRow->api_token_encrypted);
    }

    public function test_webhook_with_valid_delivered_event_advances_shipment_to_delivered(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create([
            'vendor_account_id' => $this->vendorAccount->id,
            'sale_price' => 150.00,
        ]);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $orderId = $this->postJsonAsUser('/api/v1/orders', $customer, $this->checkoutPayload($address, $product), [
            'Idempotency-Key' => (string) str()->uuid(),
        ])->assertCreated()->json('data.order.id');

        $vendorOrder = VendorOrder::query()->where('order_id', $orderId)->firstOrFail();
        $shipment = $vendorOrder->shipment;
        $shipment->update([
            'status' => ShipmentStatus::Shipped,
            'tracking_number' => 'TRK-987654',
        ]);

        CarrierShipment::query()->create([
            'shipment_id' => $shipment->id,
            'carrier_code' => 'aymakan',
            'tracking_number' => 'TRK-987654',
            'booking_status' => 'confirmed',
        ]);

        $response = $this->postJson('/api/v1/webhooks/shipping/aymakan', [
            'event_id' => 'EVT-1001',
            'tracking_number' => 'TRK-987654',
            'status' => 'DELIVERED',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('shipments', [
            'id' => $shipment->id,
            'status' => ShipmentStatus::Delivered->value,
        ]);

        // Duplicate webhook replay test
        $replayResponse = $this->postJson('/api/v1/webhooks/shipping/aymakan', [
            'event_id' => 'EVT-1001',
            'tracking_number' => 'TRK-987654',
            'status' => 'DELIVERED',
        ]);

        $replayResponse->assertStatus(200);
        $this->assertStringContainsString('duplicate ignored', $replayResponse->json('message'));
    }
}
