import ScormImporter from '@/components/import/scorm-importer'

export default function ImportPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Import SCORM</h1>
        <p className="text-[#666] text-sm mt-1">
          Upload an existing SCORM 1.2 package to re-edit it here. Works with Rise Articulate exports and most other SCORM 1.2 tools.
        </p>
      </div>
      <ScormImporter />
    </div>
  )
}