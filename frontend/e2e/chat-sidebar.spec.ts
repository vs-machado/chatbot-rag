import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 1280, height: 800 } })

test('delete button stays visible with usable hit area', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Create new chat' }).click()

  const deleteButton = page.getByLabel('Delete chat session: New chat').first()

  await expect(deleteButton).toBeVisible()
  await expect(deleteButton).toBeInViewport({ ratio: 0.9 })

  const box = await deleteButton.boundingBox()

  expect(box).not.toBeNull()
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(24)
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(24)

  const hitTargets = await deleteButton.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const points = [
      [0.2, 0.2],
      [0.5, 0.2],
      [0.8, 0.2],
      [0.5, 0.5],
      [0.5, 0.8],
    ]

    return points.map(([x, y]) => {
      const px = rect.left + rect.width * x
      const py = rect.top + rect.height * y
      const target = document.elementFromPoint(px, py)
      return target === element || element.contains(target)
    })
  })

  expect(hitTargets.filter(Boolean).length).toBeGreaterThanOrEqual(3)

  await deleteButton.click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
})
