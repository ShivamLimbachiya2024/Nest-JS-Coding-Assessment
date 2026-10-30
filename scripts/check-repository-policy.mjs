import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import filter from 'lodash/filter.js'
import includes from 'lodash/includes.js'
import join from 'lodash/join.js'
import keys from 'lodash/keys.js'
import map from 'lodash/map.js'
import slice from 'lodash/slice.js'
import split from 'lodash/split.js'
import startsWith from 'lodash/startsWith.js'
import trim from 'lodash/trim.js'
import ts from 'typescript'

const manifest = JSON.parse(readFileSync('package.json', 'utf8'))
const invalidScripts = filter(keys(manifest.scripts), (name) =>
  includes(name, ':'),
)

if (invalidScripts.length > 0) {
  throw new Error(
    `Package scripts contain forbidden separators names=${join(invalidScripts, ',')}`,
  )
}

const sourceOutput = execFileSync('rg', ['--files', 'apps', 'libs'], {
  encoding: 'utf8',
})
const sourceFiles = filter(map(split(sourceOutput, '\n'), trim), Boolean)
const misplacedSpecs = filter(
  sourceFiles,
  (file) => file.includes('/src/') && file.endsWith('.spec.ts'),
)
if (misplacedSpecs.length > 0) {
  throw new Error(
    `Unit tests must live in test folders files=${join(misplacedSpecs, ',')}`,
  )
}
const forbiddenFragments = [
  'synchronize' + ': true',
  'logger.info({',
  'logger.warn({',
  'logger.error({',
]
const violations = filter(sourceFiles, (file) => {
  const source = readFileSync(file, 'utf8')
  const syntaxTree = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const sourceViolations = []
  const containsForbiddenFragment = includes(
    map(forbiddenFragments, (fragment) => includes(source, fragment)),
    true,
  )
  const readsEnvironmentOutsideConfig =
    !startsWith(file, 'libs/config/') && includes(source, 'process.env')

  const inspectNode = (node) => {
    if (ts.isRegularExpressionLiteral(node)) {
      sourceViolations.push('regular-expression')
    }

    if (
      ts.isForStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node)
    ) {
      sourceViolations.push('manual-loop')
    }

    if (ts.isEnumDeclaration(node)) {
      const colonValue = includes(
        map(node.members, (member) => {
          const initializer = member.initializer
          return ts.isStringLiteral(initializer)
            ? includes(initializer.text, ':')
            : false
        }),
        true,
      )
      if (colonValue) sourceViolations.push('colon-enum-value')
    }

    if (ts.isStringLiteralLike(node) || ts.isTemplateExpression(node)) {
      const templateText = ts.isTemplateExpression(node)
        ? `${node.head.text}${join(
            map(node.templateSpans, (span) => span.literal.text),
            '',
          )}`
        : node.text
      const operationParts = split(templateText, 'operation=')
      const operationNames = map(
        slice(operationParts, 1),
        (part) => split(trim(part), ' ')[0] ?? '',
      )
      if (
        includes(
          map(operationNames, (name) => includes(name, ':')),
          true,
        )
      ) {
        sourceViolations.push('colon-operation-name')
      }
    }

    ts.forEachChild(node, inspectNode)
  }

  inspectNode(syntaxTree)

  return (
    containsForbiddenFragment ||
    readsEnvironmentOutsideConfig ||
    sourceViolations.length > 0
  )
})

if (violations.length > 0) {
  throw new Error(
    `Repository policy violations found files=${join(violations, ',')}`,
  )
}

process.stdout.write('Repository policy checks passed\n')
