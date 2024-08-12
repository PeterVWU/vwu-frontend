
// "use client";
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useCartQuery, useCurrentCartId } from '@graphcommerce/magento-cart';
import { CartPageDocument } from '@graphcommerce/magento-cart-checkout'
import { AddProductsToCartDocument } from './AddProductsToCart.gql';
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
    Card,
    Box,
    Grid,
    CardContent
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
    const cart = useCartQuery(CartPageDocument, {
        errorPolicy: 'all',
        fetchPolicy: 'cache-and-network',
    })
    const { loading: cartLoading, error: cartError, data: cartData, refetch: refetchCart } = cart
    console.log('cartData', cartData)
    console.log('cartError', cartError)

    const cartid = useCurrentCartId()
    console.log('cartid', cartid)

    const [addProductsToCart, { error, loading }] = useMutation(AddProductsToCartDocument, {
        onCompleted: (data) => {
            console.log('Products added to cart:', data);
            refetchCart();
            // You might want to show a success message or update the cart here
        },
    });

    // useEffect(() => {
    //     // Initialize quantities to 0 for all variants
    //     const initialQuantities = product.variants.reduce((acc, variant) => {
    //         acc[variant.product.sku] = 0;
    //         return acc;
    //     }, {} as Record<string, number>);
    //     setQuantities(initialQuantities);
    // }, [product.variants]);

    const handleQuantityChange = (sku: string, value: number) => {
        const newQuantity = Math.max(0, value || 0);
        setQuantities(prev => ({ ...prev, [sku]: newQuantity }));
    };

    const addToCart = async () => {
        if (!cartData?.cart?.id) {
            console.error('Cart ID is not available');
            return;
        }

        const selectedItems = product.variants.filter(variant =>
            quantities[variant.product.sku] > 0
        );

        const cartItems = selectedItems.map(item => ({
            sku: item.product.sku,
            quantity: quantities[item.product.sku],
        }));

        try {
            await addProductsToCart({
                variables: {
                    cartId: cartData.cart.id,
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
            <Button
                variant="contained"
                color="primary"
                onClick={addToCart}
                disabled={Object.values(quantities).every(q => q === 0) || loading || !cartData?.cart?.id}
                fullWidth
                sx={{ mt: 2 }}
            >
                {loading ? 'Adding to Cart...' : 'Add to Cart'}
            </Button>
            {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                    Error adding to cart: {error.message}
                </Typography>
            )}
            {!cartData?.cart?.id && (
                <Typography color="error" sx={{ mt: 2 }}>
                    Cart is not available. Please try refreshing the page.
                </Typography>
            )}
        </Box>
    );
};

export default ProductGrid;