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
  filterWorkspaceManifests,
  filterWorkspaceSitePages,
  findWorkspaceManifest,
  getWorkspaceSitePage,
  normalizeWorkspaceSnapshot,
} from "./workspace-index.mjs";
import { saveWorkspaceSnapshot } from "./workspace-store.mjs";

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
    byKind: { type: nonNullList(ManifestKindCountType) },
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
          throw new GraphQLError("GRAPHQL_SYNC_KEY is not configured");
        }
        if (!context.isSyncAuthorized) {
          throw new GraphQLError("unauthorized");
        }
        if (!args.snapshot || typeof args.snapshot !== "object") {
          throw new GraphQLError("snapshot must be a JSON object");
        }
        const stored = await saveWorkspaceSnapshot({
          snapshot: args.snapshot,
          sourceRevision: args.sourceRevision,
          digest: args.digest,
        });
        return { ok: true, ...stored };
      },
    },
  },
});

export const workspaceSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});
