/**
 * adapted from @see https://github.com/windwp/kysely-zod-sqlite/blob/main/src/serialize/sqlite-serialize-plugin.ts
 */

import type {
  ColumnUpdateNode,
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  PrimitiveValueListNode,
  QueryResult,
  RootOperationNode,
  UnknownRow,
  ValueNode
} from 'kysely'
import { OperationNodeTransformer } from 'kysely'
// import { SERIALIZER_REGISTRY } from '../../serializers'
import { logger } from '../../../lib/utils/logger'

export function searializeQueryValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'boolean') {
    return `${value ? 1 : 0}`
  }

  if (value !== null && typeof value === 'object') {
    return JSON.stringify(value)
  }

  return value
}

function serializeRowDate(row: Record<string, any>) {
  const DATE_KEYS = new Set([
    'transaction_at',
    'created_at',
    'updated_at',
    'start_at',
    'end_at'
  ])

  // console.log('LOG C', row)

  DATE_KEYS.forEach(key => {
    if (key in row) {
      row[key] = new Date(row[key])
    }
  })

  return row
}

export class SerializeParametersTransformer extends OperationNodeTransformer {
  public constructor() {
    super()
  }

  protected override transformPrimitiveValueList(
    node: PrimitiveValueListNode
  ): PrimitiveValueListNode {
    return {
      ...node,
      values: node.values.map(searializeQueryValue)
    }
  }

  // https://www.npmjs.com/package/zodsql
  protected transformColumnUpdate(node: ColumnUpdateNode): ColumnUpdateNode {
    const { value: valueNode } = node

    if (valueNode.kind !== 'ValueNode') {
      return super.transformColumnUpdate(node)
    }

    const { value, ...item } = valueNode as ValueNode

    const serializedValue = searializeQueryValue(value)

    return value === serializedValue
      ? super.transformColumnUpdate(node)
      : super.transformColumnUpdate({
          ...node,
          value: { ...item, value: serializedValue } as ValueNode
        })
  }

  protected override transformValue(node: ValueNode): ValueNode {
    return {
      ...node,
      value: searializeQueryValue(node.value)
    }
  }
}

export class TypeBoxModelsPlugin implements KyselyPlugin {
  private serializeParametersTransformer: SerializeParametersTransformer

  private ctx: WeakMap<PluginTransformQueryArgs['queryId'], string>

  public constructor() {
    this.serializeParametersTransformer = new SerializeParametersTransformer()
    this.ctx = new WeakMap()
  }

  public transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    const { node, queryId } = args

    if (node.kind === 'SelectQueryNode') {
      const table = (node as any).from?.froms[0]?.table.identifier?.name

      if (table) {
        this.ctx.set(queryId, table)
      }
    }

    const data = this.serializeParametersTransformer.transformNode(args.node)

    return data
  }

  private parseResult(rows: any[], table: string) {
    // const tableSerializer = SERIALIZER_REGISTRY[table]

    // if (tableSerializer === undefined) {
    //   logger.warn(`[Model Plugin]: serializer for table ${table} is not present. values will default to SQLite DB types.`)
    //   return rows
    // }

    try {
      return rows.map(row => {
        if (row === undefined || row === null) {
          return row
        }

        // return tableSerializer(row)
        return serializeRowDate(row)
      })
    } catch (error) {
      logger.error(
        `[Model Plugin]: Error while parsing table ${table}`,
        JSON.stringify(error)
      )

      throw new Error(`[Model Plugin]: ${table} => ${(error as Error).message}`)
    }
  }

  public async transformResult(
    args: PluginTransformResultArgs
  ): Promise<QueryResult<UnknownRow>> {
    const { result, queryId } = args

    const ctx = this.ctx.get(queryId)

    return result.rows && ctx
      ? {
          ...args.result,
          rows: this.parseResult(result.rows, ctx)
        }
      : args.result
  }
}
