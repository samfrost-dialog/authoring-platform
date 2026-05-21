export default function EditorPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[#555] text-sm">Editor coming in Phase 1c</p>
        <p className="text-[#333] text-xs mt-1">Course ID: {params.id}</p>
      </div>
    </div>
  )
}
