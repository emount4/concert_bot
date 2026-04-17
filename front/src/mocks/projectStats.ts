export type ProjectStats = {
  reviewsProcessed: number
  avgRating: number
  artistsTotal: number
  citiesTotal: number
}

export async function fetchMockProjectStats(signal?: AbortSignal): Promise<ProjectStats> {
  function assertNotAborted() {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
  }

  assertNotAborted()

  await new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => resolve(), 450)

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          window.clearTimeout(timeoutId)
          reject(new DOMException('Aborted', 'AbortError'))
        },
        { once: true },
      )
    }
  })

  assertNotAborted()

  return {
    reviewsProcessed: 18324,
    avgRating: 7.6,
    artistsTotal: 1240,
    citiesTotal: 98,
  }
}
