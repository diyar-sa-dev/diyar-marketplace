<?php

namespace Tests\Feature\Api\V1\Order;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Role;
use App\Models\VendorOrder;
use App\Services\Order\PaymentStateService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Symfony\Component\Process\Process;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class OrderAuthorizationTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithIdentity, RefreshDatabase;

    public function test_customer_cannot_view_another_customers_order(): void
    {
        $owner = $this->createUserWithRole(RoleName::Customer);
        $other = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 100.00]);
        $this->createVendorShippingSettings($product->vendorAccount);
        $address = $this->createCustomerAddress($owner);
        $this->addProductToUserCart($owner, $product);

        $key = (string) Str::uuid();
        $response = $this->postJsonAsUser(
            '/api/v1/orders',
            $owner,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => $key],
        )->assertCreated();

        $orderId = $response->json('data.order.id');

        $this->getJsonAsUser('/api/v1/orders/'.$orderId, $other)->assertForbidden();
    }

    public function test_dual_role_admin_cannot_view_another_customers_order_via_marketplace(): void
    {
        $owner = $this->createUserWithRole(RoleName::Customer);
        $adminVendor = $this->createUserWithRole(RoleName::Vendor);
        $this->attachRole($adminVendor, RoleName::Admin);
        $adminVendor = $adminVendor->fresh('roles');

        $product = Product::factory()->create(['sale_price' => 100.00]);
        $this->createVendorShippingSettings($product->vendorAccount);
        $address = $this->createCustomerAddress($owner);
        $this->addProductToUserCart($owner, $product);

        $response = $this->postJsonAsUser(
            '/api/v1/orders',
            $owner,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        $orderId = $response->json('data.order.id');

        $this->getJsonAsUser('/api/v1/orders/'.$orderId, $adminVendor)->assertForbidden();
    }

    private function attachRole($user, RoleName $role): void
    {
        $this->seedRoles();
        $roleModel = Role::query()->where('name', $role->value)->firstOrFail();
        $user->roles()->attach($roleModel->id, [
            'id' => (string) str()->uuid(),
            'status' => RoleStatus::Active->value,
        ]);
    }

    public function test_vendor_cannot_view_another_vendors_vendor_order(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        $product = Product::factory()->create([
            'sale_price' => 100.00,
            'vendor_account_id' => $vendorA->vendorAccount->id,
        ]);
        $this->createVendorShippingSettings($vendorA->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        $vendorOrder = VendorOrder::query()->firstOrFail();

        $this->getJsonAsUser('/api/v1/dashboard/vendor/orders/'.$vendorOrder->id, $vendorB)
            ->assertForbidden();
    }

    public function test_idempotency_key_conflict_returns_409(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 100.00]);
        $this->createVendorShippingSettings($product->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $key = (string) Str::uuid();
        $payload = $this->checkoutPayload($address, $product);

        $this->postJsonAsUser('/api/v1/orders', $customer, $payload, [
            'Idempotency-Key' => $key,
        ])->assertCreated();

        $otherAddress = $this->createCustomerAddress($customer, ['label' => 'Work']);
        $conflictPayload = array_merge($payload, ['shipping_address_id' => $otherAddress->id]);

        $this->postJsonAsUser('/api/v1/orders', $customer, $conflictPayload, [
            'Idempotency-Key' => $key,
        ])->assertStatus(409);
    }

    public function test_different_users_can_reuse_same_idempotency_key_string(): void
    {
        $userA = $this->createUserWithRole(RoleName::Customer);
        $userB = $this->createUserWithRole(RoleName::Customer);
        $productA = Product::factory()->create(['sale_price' => 100.00]);
        $productB = Product::factory()->create(['sale_price' => 150.00]);
        $this->createVendorShippingSettings($productA->vendorAccount);
        $this->createVendorShippingSettings($productB->vendorAccount);

        $addressA = $this->createCustomerAddress($userA);
        $addressB = $this->createCustomerAddress($userB);
        $this->addProductToUserCart($userA, $productA);
        $this->addProductToUserCart($userB, $productB);

        $sharedKey = 'shared-key-'.Str::uuid();

        $this->postJsonAsUser(
            '/api/v1/orders',
            $userA,
            $this->checkoutPayload($addressA, $productA),
            ['Idempotency-Key' => $sharedKey],
        )->assertCreated();

        $this->postJsonAsUser(
            '/api/v1/orders',
            $userB,
            $this->checkoutPayload($addressB, $productB),
            ['Idempotency-Key' => $sharedKey],
        )->assertCreated();

        $this->assertSame(2, Order::query()->count());
    }

    public function test_order_cancel_transition_from_pending(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);

        $order = Order::query()->create([
            'user_id' => $customer->id,
            'order_number' => 'DYR-20260817-000001',
            'status' => OrderStatus::Pending,
            'shipping_address_id' => $address->id,
            'shipping_recipient_name' => $address->recipient_name,
            'shipping_phone' => $address->phone,
            'shipping_city' => $address->city,
            'shipping_district' => $address->district,
            'shipping_street' => $address->street,
            'shipping_building' => $address->building,
            'shipping_apartment' => $address->apartment,
            'subtotal' => '100.00',
            'shipping_total' => '28.00',
            'assembly_total' => '0.00',
            'discount_total' => '0.00',
            'vat_amount' => '19.20',
            'grand_total' => '147.20',
            'idempotency_key' => (string) Str::uuid(),
            'idempotency_payload_hash' => hash('sha256', 'test'),
        ]);

        $this->actingAs($customer)->postJson('/api/v1/orders/'.$order->id.'/cancel')->assertOk();
        $this->assertSame('cancelled', $order->fresh()->status->value);
    }

    public function test_payment_state_service_rejects_invalid_transitions(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);

        $order = Order::query()->create([
            'user_id' => $customer->id,
            'order_number' => 'DYR-20260817-000002',
            'status' => OrderStatus::Pending,
            'shipping_address_id' => $address->id,
            'shipping_recipient_name' => $address->recipient_name,
            'shipping_phone' => $address->phone,
            'shipping_city' => $address->city,
            'shipping_district' => $address->district,
            'shipping_street' => $address->street,
            'shipping_building' => $address->building,
            'shipping_apartment' => $address->apartment,
            'subtotal' => '100.00',
            'shipping_total' => '28.00',
            'assembly_total' => '0.00',
            'discount_total' => '0.00',
            'vat_amount' => '19.20',
            'grand_total' => '147.20',
            'idempotency_key' => (string) Str::uuid(),
            'idempotency_payload_hash' => hash('sha256', 'test'),
        ]);

        $payment = Payment::query()->create([
            'order_id' => $order->id,
            'status' => PaymentStatus::Pending,
            'amount' => '147.20',
            'currency' => 'SAR',
            'payment_reference' => $order->order_number,
        ]);

        $service = app(PaymentStateService::class);

        $this->expectException(InvalidArgumentException::class);
        $service->transition($payment, PaymentStatus::Refunded);
    }

    public function test_payment_state_service_allows_pending_to_paid_transition(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);

        $order = Order::query()->create([
            'user_id' => $customer->id,
            'order_number' => 'DYR-20260817-000003',
            'status' => OrderStatus::Pending,
            'shipping_address_id' => $address->id,
            'shipping_recipient_name' => $address->recipient_name,
            'shipping_phone' => $address->phone,
            'shipping_city' => $address->city,
            'shipping_district' => $address->district,
            'shipping_street' => $address->street,
            'shipping_building' => $address->building,
            'shipping_apartment' => $address->apartment,
            'subtotal' => '100.00',
            'shipping_total' => '28.00',
            'assembly_total' => '0.00',
            'discount_total' => '0.00',
            'vat_amount' => '19.20',
            'grand_total' => '147.20',
            'idempotency_key' => (string) Str::uuid(),
            'idempotency_payload_hash' => hash('sha256', 'test'),
        ]);

        $payment = Payment::query()->create([
            'order_id' => $order->id,
            'status' => PaymentStatus::Pending,
            'amount' => '147.20',
            'currency' => 'SAR',
            'payment_reference' => $order->order_number,
        ]);

        $service = app(PaymentStateService::class);
        $updated = $service->transition($payment, PaymentStatus::Paid);

        $this->assertSame(PaymentStatus::Paid, $updated->status);
        $this->assertNotNull($updated->paid_at);
    }
}

class OrderNumberParallelAllocationTest extends TestCase
{
    private static string $dbPath;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        self::$dbPath = sys_get_temp_dir().'/diyar_order_number_parallel_'.Str::uuid().'.sqlite';

        if (file_exists(self::$dbPath)) {
            unlink(self::$dbPath);
        }

        touch(self::$dbPath);

        putenv('APP_ENV=testing');
        putenv('DB_CONNECTION=sqlite');
        putenv('DB_DATABASE='.self::$dbPath);

        $_ENV['APP_ENV'] = 'testing';
        $_ENV['DB_CONNECTION'] = 'sqlite';
        $_ENV['DB_DATABASE'] = self::$dbPath;

        $basePath = dirname(__DIR__, 5);

        require $basePath.'/vendor/autoload.php';

        $app = require $basePath.'/bootstrap/app.php';
        $app->make(Kernel::class)->bootstrap();

        Schema::create('order_number_sequences', function (Blueprint $table) {
            $table->string('date', 8)->primary();
            $table->unsignedInteger('last_sequence')->default(0);
            $table->timestamps();
        });
    }

    public static function tearDownAfterClass(): void
    {
        if (isset(self::$dbPath) && file_exists(self::$dbPath)) {
            unlink(self::$dbPath);
        }

        parent::tearDownAfterClass();
    }

    public function test_parallel_processes_allocate_unique_order_numbers(): void
    {
        if (! class_exists(Process::class)) {
            $this->markTestSkipped('Symfony Process not available.');
        }

        $worker = base_path('tests/Scripts/allocate_order_number_worker.php');
        $this->assertFileExists($worker);

        $processes = [];
        $workerCount = 6;

        for ($i = 0; $i < $workerCount; $i++) {
            $process = new Process(['php', $worker], base_path(), [
                'ORDER_NUMBER_TEST_DB' => self::$dbPath,
            ]);
            $process->setTimeout(30);
            $process->start();
            $processes[] = $process;
        }

        $numbers = [];

        foreach ($processes as $process) {
            $process->wait();
            $this->assertTrue($process->isSuccessful(), $process->getErrorOutput());
            $output = trim($process->getOutput());
            $this->assertNotSame('', $output);
            $numbers[] = $output;
        }

        $this->assertCount($workerCount, array_unique($numbers));

        foreach ($numbers as $number) {
            $this->assertMatchesRegularExpression('/^DYR-\d{8}-\d{6}$/', $number);
        }
    }
}
