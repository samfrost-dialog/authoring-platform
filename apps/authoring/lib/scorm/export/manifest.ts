/**
 * SCORM 1.2 manifest generator
 * Produces a fully compliant imsmanifest.xml with one SCO per lesson.
 * No vendor-specific extensions — works with any SCORM 1.2 LMS.
 */

interface Lesson {
  id: string
  title: string
  position: number
  is_section_header: boolean
}

interface ManifestOptions {
  courseId: string
  orgSlug: string
  courseTitle: string
  lessons: Lesson[]
  passingScore: number
}

export function generateManifest(opts: ManifestOptions): string {
  const { courseId, orgSlug, courseTitle, lessons, passingScore } = opts

  // Only non-section-header lessons become SCOs
  const scos = lessons.filter((l) => !l.is_section_header)

  const items = scos.map((lesson) => `
        <item identifier="item_${lesson.id}" identifierref="resource_${lesson.id}">
          <title>${escapeXml(lesson.title)}</title>
          <adlcp:masteryscore>${passingScore}</adlcp:masteryscore>
        </item>`).join('')

  const resources = scos.map((lesson) => `
    <resource identifier="resource_${lesson.id}" type="webcontent" adlcp:scormtype="sco"
              href="lessons/${lesson.id}/index.html">
      <file href="lessons/${lesson.id}/index.html"/>
      <file href="shared/scorm_api.js"/>
      <file href="shared/styles.css"/>
    </resource>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${courseId}"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                      http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org_${orgSlug}">
    <organization identifier="org_${orgSlug}">
      <title>${escapeXml(courseTitle)}</title>
      ${items}
    </organization>
  </organizations>
  <resources>
    ${resources}
    <resource identifier="resource_shared_css" type="webcontent" adlcp:scormtype="asset" href="shared/styles.css">
      <file href="shared/styles.css"/>
    </resource>
  </resources>
</manifest>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ── SCORM 1.2 schema files (required in ZIP for conformance) ─────────────────

export const SCORM_SCHEMA_FILES: Record<string, string> = {
  'imscp_rootv1p1p2.xsd': `<?xml version="1.0" encoding="UTF-8"?>
<!-- IMS Content Packaging schema stub for SCORM 1.2 conformance -->
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"/>`,

  'adlcp_rootv1p2.xsd': `<?xml version="1.0" encoding="UTF-8"?>
<!-- ADL SCORM 1.2 schema stub -->
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"/>`,

  'imsmd_rootv1p2p1.xsd': `<?xml version="1.0" encoding="UTF-8"?>
<!-- IMS Metadata schema stub -->
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"/>`,
}