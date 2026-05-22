/**
 * SCORM 1.2 Conformance Validator
 * Checks an exported ZIP against the SCORM 1.2 specification checklist.
 * Run before uploading to any LMS.
 */

import JSZip from 'jszip'
import { parse as parseHtml } from 'node-html-parser'

export interface ValidationResult {
  passed: boolean
  checks: ValidationCheck[]
  score: number // 0-100
}

export interface ValidationCheck {
  id: string
  name: string
  passed: boolean
  critical: boolean
  detail: string
}

export async function validateScormPackage(zipBuffer: Buffer): Promise<ValidationResult> {
  const zip = await JSZip.loadAsync(zipBuffer)
  const checks: ValidationCheck[] = []

  // ── 1. Manifest at ZIP root ───────────────────────────────────────────────
  const manifestFile = zip.file('imsmanifest.xml')
  checks.push({
    id: 'manifest_exists',
    name: 'imsmanifest.xml at ZIP root',
    passed: !!manifestFile,
    critical: true,
    detail: manifestFile
      ? 'imsmanifest.xml found at root of ZIP'
      : 'imsmanifest.xml missing — required at ZIP root per SCORM 1.2 spec',
  })

  if (!manifestFile) {
    return finalise(checks)
  }

  const manifestXml = await manifestFile.async('string')
  const manifest = parseHtml(manifestXml, { lowerCaseTagName: true })

  // ── 2. Schema declaration ─────────────────────────────────────────────────
  const hasAdlSchema = manifestXml.includes('ADL SCORM') && manifestXml.includes('1.2')
  checks.push({
    id: 'schema_version',
    name: 'Schema version declared as SCORM 1.2',
    passed: hasAdlSchema,
    critical: true,
    detail: hasAdlSchema
      ? 'Schema declared as ADL SCORM 1.2'
      : 'Schema version missing or not SCORM 1.2',
  })

  // ── 3. Organization and title ─────────────────────────────────────────────
  const org = manifest.querySelector('organization')
  const orgTitle = manifest.querySelector('organization > title')
  checks.push({
    id: 'organization',
    name: 'Organization with title',
    passed: !!org && !!orgTitle?.text?.trim(),
    critical: true,
    detail: org && orgTitle?.text?.trim()
      ? `Organization found: "${orgTitle.text.trim()}"`
      : 'Organization or title missing from manifest',
  })

  // ── 4. At least one SCO item ──────────────────────────────────────────────
  const items = manifest.querySelectorAll('item[identifierref]')
  checks.push({
    id: 'sco_items',
    name: 'At least one SCO item',
    passed: items.length > 0,
    critical: true,
    detail: items.length > 0
      ? `${items.length} SCO item${items.length !== 1 ? 's' : ''} found`
      : 'No SCO items found — nothing for the LMS to launch',
  })

  // ── 5. Resources reference launchable files ───────────────────────────────
  let allResourcesValid = true
  const missingResources: string[] = []

  for (const item of items) {
    const ref = item.getAttribute('identifierref')
    const resource = manifest.querySelector(`resource[identifier="${ref}"]`)
    const href = resource?.getAttribute('href')
    if (!href) { allResourcesValid = false; missingResources.push(ref || '?'); continue }
    const file = zip.file(href)
    if (!file) { allResourcesValid = false; missingResources.push(href) }
  }

  checks.push({
    id: 'resource_files',
    name: 'All SCO resources are present in ZIP',
    passed: allResourcesValid,
    critical: true,
    detail: allResourcesValid
      ? 'All referenced HTML files found in ZIP'
      : `Missing files: ${missingResources.join(', ')}`,
  })

  // ── 6. SCORM API shim present ─────────────────────────────────────────────
  const shimFile = zip.file('shared/scorm_api.js')
  checks.push({
    id: 'api_shim',
    name: 'SCORM API shim (scorm_api.js) present',
    passed: !!shimFile,
    critical: true,
    detail: shimFile
      ? 'scorm_api.js found in shared/'
      : 'scorm_api.js missing — LMS communication will fail',
  })

  // ── 7. LMSInitialize called in shim ──────────────────────────────────────
  if (shimFile) {
    const shimContent = await shimFile.async('string')
    const hasInit = shimContent.includes('LMSInitialize')
    const hasFinish = shimContent.includes('LMSFinish')
    checks.push({
      id: 'lms_initialize',
      name: 'LMSInitialize implemented in shim',
      passed: hasInit,
      critical: true,
      detail: hasInit ? 'LMSInitialize found in scorm_api.js' : 'LMSInitialize not found in shim',
    })
    checks.push({
      id: 'lms_finish',
      name: 'LMSFinish implemented in shim',
      passed: hasFinish,
      critical: true,
      detail: hasFinish ? 'LMSFinish found in scorm_api.js' : 'LMSFinish not found — session may not close cleanly',
    })
  }

  // ── 8. No proprietary extensions ─────────────────────────────────────────
  const hasProprietaryExt = manifestXml.includes('cmi.extensions') ||
    manifestXml.includes('vendor_') ||
    manifestXml.includes('aicc_')
  checks.push({
    id: 'no_proprietary',
    name: 'No proprietary LMS extensions',
    passed: !hasProprietaryExt,
    critical: false,
    detail: !hasProprietaryExt
      ? 'No vendor-specific extensions detected — LMS-agnostic'
      : 'Proprietary extensions detected — may not work on all LMS platforms',
  })

  // ── 9. masteryscore declared ──────────────────────────────────────────────
  const hasMastery = manifestXml.includes('adlcp:masteryscore') ||
    manifestXml.includes('masteryscore')
  checks.push({
    id: 'mastery_score',
    name: 'Mastery score declared',
    passed: hasMastery,
    critical: false,
    detail: hasMastery
      ? 'adlcp:masteryscore found in manifest'
      : 'masteryscore not declared — LMS will use its own default',
  })

  // ── 10. Shared CSS present ────────────────────────────────────────────────
  const cssFile = zip.file('shared/styles.css')
  checks.push({
    id: 'shared_css',
    name: 'Shared stylesheet present',
    passed: !!cssFile,
    critical: false,
    detail: cssFile ? 'shared/styles.css found' : 'shared/styles.css missing — lessons may be unstyled',
  })

  // ── 11. Check first lesson HTML for ScormAPI.initialize call ─────────────
  if (items.length > 0) {
    const firstRef = items[0].getAttribute('identifierref')
    const firstResource = manifest.querySelector(`resource[identifier="${firstRef}"]`)
    const firstHref = firstResource?.getAttribute('href')
    if (firstHref) {
      const firstHtmlFile = zip.file(firstHref)
      if (firstHtmlFile) {
        const firstHtml = await firstHtmlFile.async('string')
        const hasScormInit = firstHtml.includes('ScormAPI') || firstHtml.includes('scorm_api.js')
        checks.push({
          id: 'lesson_calls_api',
          name: 'Lesson HTML references SCORM API',
          passed: hasScormInit,
          critical: true,
          detail: hasScormInit
            ? 'First lesson HTML loads scorm_api.js'
            : 'First lesson HTML does not reference SCORM API — tracking will fail',
        })
      }
    }
  }

  return finalise(checks)
}

function finalise(checks: ValidationCheck[]): ValidationResult {
  const criticalFails = checks.filter((c) => c.critical && !c.passed)
  const passed = criticalFails.length === 0
  const passedCount = checks.filter((c) => c.passed).length
  const score = checks.length > 0 ? Math.round((passedCount / checks.length) * 100) : 0
  return { passed, checks, score }
}