import { CartFab } from '@graphcommerce/magento-cart'
import { magentoMenuToNavigation } from '@graphcommerce/magento-category'
import { CustomerFab, CustomerMenuFabItem } from '@graphcommerce/magento-customer'
import { SearchLink } from '@graphcommerce/magento-search'
import { WishlistFab, WishlistMenuFabItem } from '@graphcommerce/magento-wishlist'
import {
  DesktopNavActions,
  DesktopNavBar,
  LayoutDefault,
  LayoutDefaultProps,
  iconCustomerService,
  iconHeart,
  NavigationFab,
  MenuFabSecondaryItem,
  PlaceholderFab,
  IconSvg,
  DesktopNavItem,
  DarkLightModeMenuSecondaryItem,
  iconChevronDown,
  NavigationProvider,
  NavigationOverlay,
  useNavigationSelection,
  useMemoDeep,
  LazyHydrate,
} from '@graphcommerce/next-ui'
import { i18n } from '@lingui/core'
import { Trans } from '@lingui/react'
import { Divider, Fab, Container, Typography, Box } from '@mui/material'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Footer } from './Footer'
import { LayoutQuery } from './Layout.gql'
import { Logo } from './Logo'
import { AgeVerificationModal } from '../AgeVerificationModal'

export type LayoutNavigationProps = LayoutQuery &
  Omit<LayoutDefaultProps, 'footer' | 'header' | 'cartFab' | 'menuFab'>

export function LayoutNavigation(props: LayoutNavigationProps) {
  const { footer, menu, children, ...uiProps } = props
  const beforeHeader: React.ReactNode = (
    <Container maxWidth={false} sx={{ border: '3px black solid' }}>
      <Typography align='center' variant='h4'>
        WARNING: This product contains nicotine. Nicotine is an addictive chemical.
      </Typography>
    </Container>
  )
  const selection = useNavigationSelection()
  const router = useRouter()

  return (
    <>
      <NavigationProvider
        selection={selection}
        items={useMemoDeep(
          () => [
            <SearchLink
              href='/search'
              onClick={() => selection.set(false)}
              sx={(theme) => ({
                width: `calc(100% - ${theme.spacing(4)})`,
                m: 2,
                mb: theme.spacings.xs,
              })}
              aria-label={i18n._(/* i18n */ 'Search...')}
            >
              <Trans id='Search...' />
            </SearchLink>,
            // { id: 'home', name: <Trans id='Home' />, href: '/' },
            // {
            //   id: 'manual-item-one',
            //   href: `/${menu?.items?.[0]?.children?.[0]?.url_path}`,
            //   name: menu?.items?.[0]?.children?.[0]?.name ?? '',
            // },
            // {
            //   id: 'manual-item-two',
            //   href: `/${menu?.items?.[0]?.children?.[1]?.url_path}`,
            //   name: menu?.items?.[0]?.children?.[1]?.name ?? '',
            // },
            ...magentoMenuToNavigation(menu, false),
            // { id: 'blog', name: 'Blog', href: '/blog' },
            <Divider sx={(theme) => ({ my: theme.spacings.xs })} />,
            <CustomerMenuFabItem
              onClick={() => selection.set(false)}
              key='account'
              guestHref='/account/signin'
              authHref='/account'
            >
              <Trans id='Account' />
            </CustomerMenuFabItem>,
            <MenuFabSecondaryItem
              key='service'
              icon={<IconSvg src={iconCustomerService} size='medium' />}
              href='/service'
            >
              <Trans id='Customer Service' />
            </MenuFabSecondaryItem>,
            <WishlistMenuFabItem
              onClick={() => selection.set(false)}
              key='wishlist'
              icon={<IconSvg src={iconHeart} size='medium' />}
            >
              <Trans id='Wishlist' />
            </WishlistMenuFabItem>,
            <DarkLightModeMenuSecondaryItem key='darkmode' />,
          ],
          [menu, selection],
        )}
      >
        <NavigationOverlay
          stretchColumns={false}
          variantSm='left'
          sizeSm='full'
          justifySm='start'
          itemWidthSm='70vw'
          variantMd='left'
          sizeMd='full'
          justifyMd='start'
          itemWidthMd='230px'
          mouseEvent='hover'
          itemPadding='md'
        />
      </NavigationProvider>

      <LayoutDefault
        {...uiProps}
        beforeHeader={beforeHeader}
        noSticky={router.asPath.split('?')[0] === '/'}
        header={
          <>
            <Box display='flex' alignItems='center' flexDirection='row' gap={1}>
              <Logo />
              <Typography variant='h2'>VapeWholeSaleUSA</Typography>
            </Box>
            {/* Categories that have children show sub menu */}
            <DesktopNavBar>
              {menu?.items?.[0]?.children?.map((item) =>
                item?.children && item?.children?.length > 1 ? (
                  <DesktopNavItem
                    key={item?.uid}
                    onClick={() => selection.set([item?.uid || ''])}
                    onKeyUp={(evt) => {
                      if (evt.key === 'Enter') {
                        selection.set([item?.uid || ''])
                      }
                    }}
                    tabIndex={0}
                  >
                    {item?.name}
                    <IconSvg src={iconChevronDown} />
                  </DesktopNavItem>
                ) : (
                  <DesktopNavItem key={item?.uid} href={`/${item?.url_path}`}>
                    {item?.name}
                  </DesktopNavItem>
                ),
              )}

              {/* <DesktopNavItem
                onClick={() => selection.set([menu?.items?.[0]?.uid || ''])}
                onKeyUp={(evt) => {
                  if (evt.key === 'Enter') {
                    selection.set([menu?.items?.[0]?.uid || ''])
                  }
                }}
                tabIndex={0}
              >
                {menu?.items?.[0]?.name}
                <IconSvg src={iconChevronDown} />
              </DesktopNavItem>

              <DesktopNavItem href='/blog'>
                <Trans id='Blog' />
              </DesktopNavItem> */}
            </DesktopNavBar>
            <DesktopNavActions>
              {!router.pathname.startsWith('/search') && (
                <SearchLink
                  href='/search'
                  aria-label={i18n._(/* i18n */ 'Search...')}
                  breakpoint='lg'
                />
              )}
              <Fab
                href='/service'
                aria-label={i18n._(/* i18n */ 'Customer Service')}
                size='large'
                color='inherit'
              >
                <IconSvg src={iconCustomerService} size='large' />
              </Fab>
              <WishlistFab icon={<IconSvg src={iconHeart} size='large' />} />
              <CustomerFab guestHref='/account/signin' authHref='/account' />
              {/* The placeholder exists because the CartFab is sticky but we want to reserve the space for the <CartFab /> */}
              <PlaceholderFab />
            </DesktopNavActions>
          </>
        }
        footer={<Footer footer={footer} />}
        cartFab={<CartFab />}
        menuFab={<NavigationFab onClick={() => selection.set([])} />}
      >
        <AgeVerificationModal></AgeVerificationModal>
        {children}
      </LayoutDefault>
    </>
  )
}
