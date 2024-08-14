
"use client";
import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useCartQuery, useCartIdCreate } from '@graphcommerce/magento-cart';
import { CartPageDocument } from '@graphcommerce/magento-cart-checkout'
import { AddProductsToCartDocument } from './AddProductsToCart.gql';
import { CreateEmptyCartDocument } from './CreateEmptyCart.gql';
import {
    Paper,
    Typography,
    TextField,
    Button,
    Card,
    Box,
    Grid,
    CardContent,
} from '@mui/material';
import { styled } from '@mui/system';
import Cookies from 'js-cookie';

const StyledCard = styled(Card)<{ index: number }>(({ theme, index }) => ({
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: index % 2 === 0 ? theme.palette.background.default : theme.palette.background.paper,
}));

const HeaderTypography = styled(Typography)({
    textAlign: 'center',
    fontWeight: 'bold',
    minHeight: '2.5em', // Approximately 2 lines of text
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
});
const CenteredTypography = styled(Typography)({
    textAlign: 'center',
    minHeight: '2.5em', // Approximately 2 lines of text
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
});
const CenteredContent = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
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
    // const [cartId, setCartId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const [createEmptyCart] = useMutation<{ createEmptyCart: string }>(CreateEmptyCartDocument);

    const cartId = useCartIdCreate();

    const [addProductsToCart, { loading }] = useMutation(AddProductsToCartDocument, {
        onCompleted: (data) => {
            console.log('Products added to cart:', data);
            setMessage({ text: `${product.name} has been added to your shopping cart!`, type: 'success' });

        },
        onError: (error) => {
            console.log('add to cart error', error)
            setMessage({ text: `Error adding products to cart: ${error.message}`, type: 'error' });
        }
    });

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

    const addToCart = async () => {
        let currentCartId = await cartId();
        console.log('currentCartId', currentCartId)

        // if (!currentCartId) {
        //     try {
        //         const result = await createEmptyCart();
        //         if (result.data?.createEmptyCart) {
        //             currentCartId = result.data.createEmptyCart;
        //             setCartId(currentCartId);
        //             Cookies.set('cart', currentCartId);
        //         } else {
        //             throw new Error('Failed to create a new cart');
        //         }
        //     } catch (err) {
        //         console.error('Error creating cart:', err);
        //         setMessage({ text: err instanceof Error ? err.message : 'An unknown error occurred', type: 'error' });
        //         return;
        //     }
        // }

        const cartItems = Object.entries(quantities)
            .filter(([_, quantity]) => quantity > 0)
            .map(([sku, quantity]) => ({ sku, quantity }));

        try {
            await addProductsToCart({
                variables: {
                    cartId: currentCartId,
                    cartItems,
                },
            });
            // Reset quantities after successful addition
            setQuantities(prev => Object.fromEntries(Object.keys(prev).map(key => [key, 0])));
        } catch (err) {
            console.error('Error adding products to cart:', err);
        }
    };


    // Use the main product's price for all variants
    const price = product.price_range.minimum_price.final_price.value;

    // Calculate column widths based on the number of configurable options
    const optionCount = product.configurable_options.length;
    const optionWidth = Math.floor(12 / (optionCount + 3)); // +3 for price, subtotal, and quantity

    const totalQuantity = Object.values(quantities).reduce((sum, q) => sum + q, 0);
    const totalPrice = Object.values(quantities).reduce((sum, q) => sum + q * price, 0);

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={1} sx={{ mb: 2 }}>
                {product.configurable_options.map(option => (
                    <Grid item xs={optionWidth} key={option.attribute_code}>
                        <HeaderTypography variant="subtitle2">{option.label}</HeaderTypography>
                    </Grid>
                ))}
                <Grid item xs={optionWidth}>
                    <HeaderTypography variant="subtitle2">Price</HeaderTypography>
                </Grid>
                <Grid item xs={optionWidth}>
                    <HeaderTypography variant="subtitle2">Subtotal</HeaderTypography>
                </Grid>
                <Grid item xs={optionWidth}>
                    <HeaderTypography variant="subtitle2">Quantity</HeaderTypography>
                </Grid>
            </Grid>
            {product.variants.map((variant, index) => (
                <StyledCard key={variant.product.sku} index={index} sx={{ mb: 1 }}>
                    <CardContent sx={{ p: 1 }}>
                        <Grid container spacing={1} alignItems="stretch" style={{ minHeight: '4em' }}>
                            {product.configurable_options.map(option => {
                                const attribute = variant.attributes.find(attr => attr.code === option.attribute_code);
                                const value = option.values.find(val => val.uid === attribute?.uid);
                                return (
                                    <Grid item xs={optionWidth} key={option.attribute_code}>
                                        <CenteredContent>
                                            <CenteredTypography variant="body2">
                                                {value?.store_label || 'N/A'}
                                            </CenteredTypography>
                                        </CenteredContent>
                                    </Grid>
                                );
                            })}
                            <Grid item xs={optionWidth}>
                                <CenteredContent>
                                    <CenteredTypography variant="body2">${price.toFixed(2)}</CenteredTypography>
                                </CenteredContent>
                            </Grid>
                            <Grid item xs={optionWidth}>
                                <CenteredContent>
                                    <CenteredTypography variant="body2">
                                        ${((quantities[variant.product.sku] || 0) * price).toFixed(2)}
                                    </CenteredTypography>
                                </CenteredContent>
                            </Grid>
                            <Grid item xs={optionWidth}>
                                <CenteredContent>
                                    <TextField
                                        type="number"
                                        value={quantities[variant.product.sku] || 0}
                                        onChange={(e) => handleQuantityChange(variant.product.sku, parseInt(e.target.value) || 0)}
                                        InputProps={{ inputProps: { min: 0, style: { textAlign: 'center' } } }}
                                        fullWidth
                                        size="small"
                                    />
                                </CenteredContent>
                            </Grid>
                        </Grid>
                    </CardContent>
                </StyledCard>
            ))}


            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Typography variant="h6">
                        Total: {totalQuantity} items | ${totalPrice.toFixed(2)}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={addToCart}
                        disabled={totalQuantity === 0 || loading}
                    >
                        {loading ? 'Adding to Cart...' : 'Add to Cart'}
                    </Button>
                </Box>
                {message && (
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 1,
                            color: message.type === 'success' ? 'green' : 'red',
                            alignSelf: 'flex-end'
                        }}
                    >
                        {message.text}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default ProductGrid;