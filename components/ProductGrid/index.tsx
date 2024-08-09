
"use client";
import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    TextField,
    Button,
    IconButton,
} from '@mui/material';
import { styled } from '@mui/system';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    '&:hover': {
        boxShadow: (theme.shadows as any)[4],
    },
}));

const QuantityControl = styled('div')({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
});

export interface ConfigurableProduct {
    __typename: 'ConfigurableProduct';
    name: string;
    sku: string;
    small_image: {
        url: string;
        label: string;
    };
    price_range: {
        minimum_price: {
            final_price: {
                currency: string;
                value: number;
            };
        };
    };
    configurable_options: Array<{
        attribute_code: string;
        label: string;
        values: Array<{
            uid: string;
            store_label: string;
        }>;
    }>;
    variants: Array<{
        attributes: Array<{
            code: string;
            uid: string;
        }>;
        product: {
            uid: string;
            sku: string;
            name: string;
            small_image: {
                url: string;
                label: string;
            };
        };
    }>;
}

interface ProductGridProps {
    product: ConfigurableProduct;
}

const ProductGrid: React.FC<ProductGridProps> = ({ product }) => {
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    useEffect(() => {
        // Initialize quantities to 0 for all variants
        const initialQuantities = product.variants.reduce((acc, variant) => {
            acc[variant.product.sku] = 0;
            return acc;
        }, {} as Record<string, number>);
        setQuantities(initialQuantities);
    }, [product.variants]);

    const handleQuantityChange = (sku: string, value: number) => {
        const newQuantity = Math.max(0, value || 0);
        setQuantities(prev => ({ ...prev, [sku]: newQuantity }));
    };

    const addToCart = () => {
        const selectedItems = product.variants.filter(variant =>
            quantities[variant.product.sku] > 0
        );
        console.log('Added to cart:', selectedItems.map(item => ({
            sku: item.product.sku,
            quantity: quantities[item.product.sku],
            name: item.product.name,
        })));
        // Implement your add to cart logic here
    };
    // Use the main product's price for all variants
    const price = product.price_range.minimum_price.final_price.value;

    return (
        <StyledPaper>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {product.configurable_options.map(option => (
                                <TableCell key={option.attribute_code}>{option.label}</TableCell>
                            ))}
                            <TableCell>Price</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Subtotal</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {product.variants.map((variant) => (
                            <TableRow key={variant.product.sku}>
                                {product.configurable_options.map(option => {
                                    const attribute = variant.attributes.find(attr => attr.code === option.attribute_code);
                                    const value = option.values.find(val => val.uid === attribute?.uid);
                                    return (
                                        <TableCell key={option.attribute_code}>
                                            {value?.store_label || 'N/A'}
                                        </TableCell>
                                    );
                                })}
                                <TableCell>${price.toFixed(2)}</TableCell>
                                <TableCell>

                                    <TextField
                                        type="number"
                                        label="Quantity"
                                        value={quantities[variant.product.sku] || 0}
                                        onChange={(e) => handleQuantityChange(variant.product.sku, parseInt(e.target.value) || 0)}
                                        InputProps={{ inputProps: { min: 1 } }}
                                        fullWidth
                                    />
                                    {/* <QuantityControl>
                                        <IconButton
                                            onClick={() => handleQuantityChange(variant.product.sku, (quantities[variant.product.sku] || 0) - 1)}
                                            size="small"
                                        >
                                            <RemoveIcon />
                                        </IconButton>
                                        <TextField
                                            type="number"
                                            value={quantities[variant.product.sku] || 0}
                                            onChange={(e) => handleQuantityChange(variant.product.sku, parseInt(e.target.value) || 0)}
                                            InputProps={{ inputProps: { min: 0, style: { textAlign: 'center' } } }}
                                            style={{ width: '60px' }}
                                        />
                                        <IconButton
                                            onClick={() => handleQuantityChange(variant.product.sku, (quantities[variant.product.sku] || 0) + 1)}
                                            size="small"
                                        >
                                            <AddIcon />
                                        </IconButton>
                                    </QuantityControl> */}
                                </TableCell>
                                <TableCell>
                                    ${((quantities[variant.product.sku] || 0) * price).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Button
                variant="contained"
                color="primary"
                onClick={addToCart}
                disabled={Object.values(quantities).every(q => q === 0)}
                fullWidth
                style={{ marginTop: '1rem' }}
            >
                Add to Cart
            </Button>
        </StyledPaper>
    );
};

export default ProductGrid;