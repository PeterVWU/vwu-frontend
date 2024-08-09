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
import { print } from 'graphql';


const loggingLink = new ApolloLink((operation, forward) => {
  if (operation.operationName === 'ProductPage2') {
    const context = operation.getContext();
    console.log('context key', Object.keys(context));
    console.log('operation key', Object.keys(operation));
    const queryString = print(operation.query);
    console.log('query', queryString);
    console.log('GraphQL Request:', {
      operationName: operation.operationName,
      variables: operation.variables,
    });
  }


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
