import dynamic from 'next/dynamic';
import React from 'react';
import type { ConfigurableProduct } from './ProductVariantsGrid'; // adjust the import path as needed

const DynamicProductVariantsGrid = dynamic(() => import('./ProductVariantsGrid').then(mod => mod.ProductVariantsGrid), {
    ssr: false,
});

interface ProductVariantsGridWrapperProps {
    product: ConfigurableProduct;
}

export const ProductVariantsGridWrapper: React.FC<ProductVariantsGridWrapperProps> = ({ product }) => {
    return <DynamicProductVariantsGrid product={product} />;
};

export default ProductVariantsGridWrapper;