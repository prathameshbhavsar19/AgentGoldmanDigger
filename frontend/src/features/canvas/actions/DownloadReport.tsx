export async function downloadReport(jobId: string): Promise<void> {
  try {
    const res = await fetch(`/api/strategy/report/${jobId}`)
    const data = await res.json()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `portfolio-gps-report-${jobId}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    window.open(`/api/strategy/report/${jobId}`, '_blank')
  }
}
