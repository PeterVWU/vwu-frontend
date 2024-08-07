import {
  NormalizedCacheObject,
  ApolloClient,
  ApolloLink,
  errorLink,
  measurePerformanceLink,
  InMemoryCache,
  fragments,
  graphqlConfig,
  mergeTypePolicies,
  FetchPolicy,
} from '@graphcommerce/graphql'
import { MeshApolloLink, getBuiltMesh } from '@graphcommerce/graphql-mesh'
import { storefrontConfig, storefrontConfigDefault } from '@graphcommerce/next-ui'
import { i18nSsrLoader } from '../i18n/I18nProvider'


const loggingLink = new ApolloLink((operation, forward) => {
  console.log('GraphQL Request:', {
    operationName: operation.operationName,
    variables: operation.variables,
    headers: operation.getContext().headers, // Access headers from context
    uri: operation.getContext().uri
  });

  return forward(operation).map((response) => {
    const updatedContext = operation.getContext();
    console.log(`GraphQL URL: ${updatedContext.uri || 'Not available'}`);
    console.log(`GraphQL Response for ${operation.operationName}:`, {
      data: response?.data,
      errors: response?.errors,
      extensions: response?.extensions,
      // networkStatus: response?.networkStatus
    });
    return response;
  });
});

function client(locale: string | undefined, fetchPolicy: FetchPolicy = 'no-cache') {
  const config = graphqlConfig({
    storefront: storefrontConfig(locale) ?? storefrontConfigDefault(),
  })

  return new ApolloClient({
    link: ApolloLink.from([
      loggingLink,
      measurePerformanceLink,
      errorLink,
      ...config.links,
      new MeshApolloLink(getBuiltMesh()),
    ]),
    cache: new InMemoryCache({
      possibleTypes: fragments.possibleTypes,
      typePolicies: mergeTypePolicies(config.policies),
    }),
    ssrMode: true,
    name: 'ssr',
    defaultOptions: { query: { errorPolicy: 'all', fetchPolicy } },
  })
}

const sharedClient: {
  [locale: string]: ApolloClient<NormalizedCacheObject>
} = {}

/**
 * Any queries made with the graphqlSharedClient will be send to the browser and injected in the
 * browser's cache.
 */
export function graphqlSharedClient(locale: string | undefined) {
  if (!locale) return client(locale, 'cache-first')

  // Create a client if it doesn't exist for the locale.
  if (!sharedClient[locale]) sharedClient[locale] = client(locale, 'cache-first')
  return sharedClient[locale]
}

const ssrClient: {
  [locale: string]: ApolloClient<NormalizedCacheObject>
} = {}

export function graphqlSsrClient(locale: string | undefined) {
  i18nSsrLoader(locale)
  if (!locale) return client(locale, 'no-cache')

  // Create a client if it doesn't exist for the locale.
  if (!ssrClient[locale]) ssrClient[locale] = client(locale, 'no-cache')

  return ssrClient[locale]
}
