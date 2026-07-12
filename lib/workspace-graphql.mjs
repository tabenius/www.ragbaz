import {
  GraphQLError,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  Kind,
} from "graphql";
import {
  filterPublicProducts,
  filterPublicTracks,
  filterWorkspaceManifests,
  filterWorkspaceSitePages,
  findPublicProduct,
  findWorkspaceManifest,
  getWorkspaceSitePage,
  normalizeWorkspaceSnapshot,
  publicWorkspaceCatalog,
} from "./workspace-index.mjs";
import { getDb } from "./accounts/env.mjs";
import { saveWorkspaceSnapshot } from "./workspace-store.mjs";
import { refreshWorkspaceSnapshotFromUpstream } from "./workspace-upstream.mjs";

function graphqlError(message, status, code) {
  return new GraphQLError(message, {
    extensions: {
      code,
      http: { status },
    },
  });
}

function parseJsonLiteral(node) {
  switch (node.kind) {
    case Kind.STRING:
    case Kind.ENUM:
      return node.value;
    case Kind.INT:
      return Number.parseInt(node.value, 10);
    case Kind.FLOAT:
      return Number.parseFloat(node.value);
    case Kind.BOOLEAN:
      return node.value;
    case Kind.NULL:
      return null;
    case Kind.LIST:
      return node.values.map(parseJsonLiteral);
    case Kind.OBJECT:
      return Object.fromEntries(node.fields.map((field) => [field.name.value, parseJsonLiteral(field.value)]));
    default:
      return null;
  }
}

const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(node) {
    return parseJsonLiteral(node);
  },
});

const ManifestKindType = new GraphQLEnumType({
  name: "ManifestKind",
  values: {
    COMPONENT: { value: "component" },
    NPM: { value: "npm" },
    CARGO: { value: "cargo" },
    PYPROJECT: { value: "pyproject" },
    WORKSPACE_META: { value: "workspace_meta" },
    WRANGLER_JSONC: { value: "wrangler_jsonc" },
    WRANGLER_TOML: { value: "wrangler_toml" },
  },
});

const nonNullList = (type) => new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(type)));

const SitePageType = new GraphQLObjectType({
  name: "SitePage",
  fields: {
    path: { type: new GraphQLNonNull(GraphQLString) },
    localPath: { type: new GraphQLNonNull(GraphQLString) },
    section: { type: GraphQLString },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    url: { type: new GraphQLNonNull(GraphQLString) },
  },
});

const ManifestStatEntryType = new GraphQLObjectType({
  name: "ManifestStatEntry",
  fields: {
    date: { type: GraphQLString },
    dollars: { type: GraphQLFloat },
    completion: { type: GraphQLFloat },
    note: { type: GraphQLString },
  },
});

const ManifestStatsType = new GraphQLObjectType({
  name: "ManifestStats",
  fields: {
    path: { type: GraphQLString },
    currency: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
    latestDollars: { type: GraphQLFloat },
    latestCompletion: { type: GraphQLFloat },
    latest: { type: ManifestStatEntryType },
    entries: { type: nonNullList(ManifestStatEntryType) },
  },
});

const WorkspaceManifestType = new GraphQLObjectType({
  name: "WorkspaceManifest",
  fields: {
    key: { type: new GraphQLNonNull(GraphQLString) },
    kind: { type: new GraphQLNonNull(ManifestKindType) },
    path: { type: new GraphQLNonNull(GraphQLString) },
    localPath: { type: new GraphQLNonNull(GraphQLString) },
    directory: { type: new GraphQLNonNull(GraphQLString) },
    repoPath: { type: new GraphQLNonNull(GraphQLString) },
    workspaceArea: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: GraphQLString },
    displayName: { type: GraphQLString },
    version: { type: GraphQLString },
    description: { type: GraphQLString },
    componentId: { type: GraphQLString },
    owner: { type: GraphQLString },
    lifecycle: { type: GraphQLString },
    packageManager: { type: GraphQLString },
    tags: { type: nonNullList(GraphQLString) },
    personas: { type: nonNullList(GraphQLString) },
    capabilities: { type: nonNullList(GraphQLString) },
    scripts: { type: nonNullList(GraphQLString) },
    dependencyNames: { type: nonNullList(GraphQLString) },
    endpointNames: { type: nonNullList(GraphQLString) },
    publicUrls: { type: nonNullList(GraphQLString) },
    supportTier: { type: GraphQLString },
    salesStatus: { type: GraphQLString },
    statsFile: { type: GraphQLString },
    statsParseError: { type: GraphQLString },
    stats: { type: ManifestStatsType },
    parseError: { type: GraphQLString },
    manifest: { type: JSONScalar },
  },
});

const ManifestKindCountType = new GraphQLObjectType({
  name: "ManifestKindCount",
  fields: {
    kind: { type: new GraphQLNonNull(ManifestKindType) },
    count: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

const WorkspaceStatsType = new GraphQLObjectType({
  name: "WorkspaceStats",
  fields: {
    totalManifests: { type: new GraphQLNonNull(GraphQLInt) },
    totalSitePages: { type: new GraphQLNonNull(GraphQLInt) },
    publishedProducts: { type: new GraphQLNonNull(GraphQLInt) },
    catalogTracks: { type: new GraphQLNonNull(GraphQLInt) },
    prospectEntries: { type: new GraphQLNonNull(GraphQLInt) },
    byKind: { type: nonNullList(ManifestKindCountType) },
  },
});

const PublicCatalogCtaType = new GraphQLObjectType({
  name: "PublicCatalogCta",
  fields: {
    label: { type: new GraphQLNonNull(GraphQLString) },
    href: { type: new GraphQLNonNull(GraphQLString) },
    primary: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
});

const PublicCatalogCardType = new GraphQLObjectType({
  name: "PublicCatalogCard",
  fields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    intro: { type: new GraphQLNonNull(GraphQLString) },
    items: { type: nonNullList(GraphQLString) },
  },
});

const PublicCatalogProspectType = new GraphQLObjectType({
  name: "PublicCatalogProspect",
  fields: {
    slug: { type: GraphQLString },
    order: { type: GraphQLString },
    heroCopy: { type: new GraphQLNonNull(GraphQLString) },
    chips: { type: nonNullList(GraphQLString) },
    cards: { type: nonNullList(PublicCatalogCardType) },
    note: { type: new GraphQLNonNull(GraphQLString) },
    ctas: { type: nonNullList(PublicCatalogCtaType) },
  },
});

const PublicCatalogEntryType = new GraphQLObjectType({
  name: "PublicCatalogEntry",
  fields: {
    kind: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    tag: { type: new GraphQLNonNull(GraphQLString) },
    tagLabel: { type: new GraphQLNonNull(GraphQLString) },
    short: { type: new GraphQLNonNull(GraphQLString) },
    value: { type: new GraphQLNonNull(GraphQLString) },
    pricing: { type: new GraphQLNonNull(GraphQLString) },
    revenue: { type: new GraphQLNonNull(GraphQLString) },
    repo: { type: GraphQLString },
    links: { type: JSONScalar },
    components: { type: nonNullList(GraphQLString) },
    completion: { type: GraphQLFloat },
    completionEvaluatedAt: { type: GraphQLString },
    finishedValueUsd: { type: GraphQLFloat },
    currentValueUsd: { type: GraphQLFloat },
    prospect: { type: PublicCatalogProspectType },
  },
});

const PublicCatalogStatsType = new GraphQLObjectType({
  name: "PublicCatalogStats",
  fields: {
    publishedProducts: { type: new GraphQLNonNull(GraphQLInt) },
    tracks: { type: new GraphQLNonNull(GraphQLInt) },
    prospectEntries: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

const PublicCatalogType = new GraphQLObjectType({
  name: "PublicCatalog",
  fields: {
    version: { type: GraphQLString },
    evaluatedAt: { type: GraphQLString },
    description: { type: new GraphQLNonNull(GraphQLString) },
    products: { type: nonNullList(PublicCatalogEntryType) },
    tracks: { type: nonNullList(PublicCatalogEntryType) },
    stats: { type: new GraphQLNonNull(PublicCatalogStatsType) },
  },
});

const WorkspaceSnapshotType = new GraphQLObjectType({
  name: "WorkspaceSnapshot",
  fields: {
    version: { type: new GraphQLNonNull(GraphQLInt) },
    generatedAt: { type: GraphQLString },
    storedAt: { type: GraphQLString },
    sourceRevision: { type: GraphQLString },
    digest: { type: GraphQLString },
    manifests: { type: nonNullList(WorkspaceManifestType) },
    sitePages: { type: nonNullList(SitePageType) },
    publicCatalog: { type: new GraphQLNonNull(PublicCatalogType) },
    stats: { type: new GraphQLNonNull(WorkspaceStatsType) },
  },
});

const WorkspaceSyncResultType = new GraphQLObjectType({
  name: "WorkspaceSyncResult",
  fields: {
    ok: { type: new GraphQLNonNull(GraphQLBoolean) },
    version: { type: new GraphQLNonNull(GraphQLInt) },
    generatedAt: { type: GraphQLString },
    storedAt: { type: GraphQLString },
    sourceRevision: { type: GraphQLString },
    digest: { type: GraphQLString },
    manifestsCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: (result) => result.stats.totalManifests,
    },
    sitePagesCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: (result) => result.stats.totalSitePages,
    },
  },
});

const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    manifests: {
      type: nonNullList(WorkspaceManifestType),
      args: {
        kind: { type: ManifestKindType },
        pathPrefix: { type: GraphQLString },
        query: { type: GraphQLString },
        tag: { type: GraphQLString },
        limit: { type: GraphQLInt },
      },
      resolve: (_source, args, context) => filterWorkspaceManifests(context.snapshot, args),
    },
    manifest: {
      type: WorkspaceManifestType,
      args: {
        path: { type: GraphQLString },
        componentId: { type: GraphQLString },
        name: { type: GraphQLString },
      },
      resolve: (_source, args, context) => findWorkspaceManifest(context.snapshot, args),
    },
    sitePages: {
      type: nonNullList(SitePageType),
      args: {
        section: { type: GraphQLString },
        query: { type: GraphQLString },
        limit: { type: GraphQLInt },
      },
      resolve: (_source, args, context) => filterWorkspaceSitePages(context.snapshot, args),
    },
    sitePage: {
      type: SitePageType,
      args: { path: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: (_source, args, context) => getWorkspaceSitePage(context.snapshot, args.path),
    },
    publicCatalog: {
      type: new GraphQLNonNull(PublicCatalogType),
      resolve: (_source, _args, context) => publicWorkspaceCatalog(context.snapshot),
    },
    publicProducts: {
      type: nonNullList(PublicCatalogEntryType),
      args: {
        query: { type: GraphQLString },
        tag: { type: GraphQLString },
        limit: { type: GraphQLInt },
      },
      resolve: (_source, args, context) => filterPublicProducts(context.snapshot, args),
    },
    publicProduct: {
      type: PublicCatalogEntryType,
      args: { slug: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: (_source, args, context) => findPublicProduct(context.snapshot, args),
    },
    publicTracks: {
      type: nonNullList(PublicCatalogEntryType),
      args: {
        query: { type: GraphQLString },
        limit: { type: GraphQLInt },
      },
      resolve: (_source, args, context) => filterPublicTracks(context.snapshot, args),
    },
    stats: {
      type: new GraphQLNonNull(WorkspaceStatsType),
      resolve: (_source, _args, context) => normalizeWorkspaceSnapshot(context.snapshot).stats,
    },
    snapshot: {
      type: new GraphQLNonNull(WorkspaceSnapshotType),
      resolve: (_source, _args, context) => normalizeWorkspaceSnapshot(context.snapshot),
    },
  },
});

const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    pushWorkspaceSnapshot: {
      type: new GraphQLNonNull(WorkspaceSyncResultType),
      args: {
        snapshot: { type: new GraphQLNonNull(JSONScalar) },
        sourceRevision: { type: GraphQLString },
        digest: { type: GraphQLString },
      },
      async resolve(_source, args, context) {
        if (!context.syncKeyConfigured) {
          throw graphqlError("GRAPHQL_SYNC_KEY is not configured", 503, "SERVICE_UNAVAILABLE");
        }
        if (!context.isSyncAuthorized) {
          throw graphqlError("unauthorized", 401, "UNAUTHORIZED");
        }
        if (!args.snapshot || typeof args.snapshot !== "object") {
          throw graphqlError("snapshot must be a JSON object", 400, "BAD_USER_INPUT");
        }
        const stored = await saveWorkspaceSnapshot({
          snapshot: args.snapshot,
          sourceRevision: args.sourceRevision,
          digest: args.digest,
        });
        return { ok: true, ...stored };
      },
    },
    refreshWorkspaceSnapshot: {
      type: new GraphQLNonNull(WorkspaceSyncResultType),
      async resolve(_source, _args, context) {
        if (!context.syncKeyConfigured) {
          throw graphqlError("GRAPHQL_SYNC_KEY is not configured", 503, "SERVICE_UNAVAILABLE");
        }
        if (!context.isSyncAuthorized) {
          throw graphqlError("unauthorized", 401, "UNAUTHORIZED");
        }
        const stored = await refreshWorkspaceSnapshotFromUpstream({
          db: getDb(),
          endpoint: context.workspaceUpstreamUrl,
          key: context.workspaceUpstreamKey,
        });
        return stored;
      },
    },
  },
});

export const workspaceSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});
