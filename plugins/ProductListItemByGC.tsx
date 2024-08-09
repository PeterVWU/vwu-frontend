import type { ProductListItem } from '@graphcommerce/magento-product'
import type { ReactPlugin } from '@graphcommerce/next-config'
import { Typography } from '@mui/material'

export const component = 'ProductListItem' // Component to extend, required
export const exported = '@graphcommerce/magento-product' // Location where the component is exported, required

const ListPlugin: ReactPlugin<typeof ProductListItem> = (props) => {
    // Prev in this case is ProductListItem, you should be able to see this if you log it.
    const { Prev, ...rest } = props
    return (
        <Prev
            {...rest}
            subTitle={
                <Typography component='span' variant='caption'>
                    Plugin!
                </Typography>
            }
        />
    )
}
export const Plugin = ListPlugin // An export with the name Plugin, required