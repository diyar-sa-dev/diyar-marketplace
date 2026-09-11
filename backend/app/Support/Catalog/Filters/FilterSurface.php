<?php

namespace App\Support\Catalog\Filters;

enum FilterSurface: string
{
    case ProductListing = 'product_listing';
    case ServiceListing = 'service_listing';
    case CatalogSearch = 'catalog_search';
}
