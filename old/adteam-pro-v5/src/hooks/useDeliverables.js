/**
 * useDeliverables
 *
 * All "task deliverables → product assets" logic lives here.
 * Nothing else in the codebase touches product_assets directly.
 *
 * Exported constants & functions:
 *
 *   DELIVERABLE_CONFIG
 *     Map of task-title-prefix → { field, label, placeholder, assetKey }
 *     Used by TaskModal to know which extra field to show.
 *
 *   getDeliverableConfig(taskTitle)
 *     Returns the config for a task title, or null if not a deliverable task.
 *
 *   validateDeliverable(taskTitle, deliverableUrl)
 *     Returns an error string if the task is a deliverable type but the URL
 *     is empty, otherwise returns null (valid).
 *
 *   saveDeliverableAsset(productName, taskTitle, deliverableUrl)
 *     Upserts the asset URL into product_assets for the given product.
 *     Safe to call multiple times — never overwrites a column that already
 *     has a value UNLESS the new value is provided.
 *     Called by TaskManager after a deliverable task is saved as completed.
 */

import { supabase } from '../lib/supabase.js'

// ── Deliverable task definitions ─────────────────────────────────────────────
// Each entry maps a task title prefix to the asset field it populates.

export const DELIVERABLE_CONFIG = {
  // "Create landing page for {product}"
  landing: {
    titlePrefix:  'Create landing page for ',
    field:        'landing_page_url',
    label:        'Landing Page URL',
    placeholder:  'https://yourstore.com/product-page',
    assetSection: 'Landing Page',
    icon:         '🌐',
    hint:         'Required before marking this task as Done.',
  },
  // "Create 4 video creatives for {product}"
  videos: {
    titlePrefix:  'Create 4 video creatives for ',
    field:        'creatives_drive_url',
    label:        'Google Drive Folder URL (Video Creatives)',
    placeholder:  'https://drive.google.com/drive/folders/…',
    assetSection: 'Creatives',
    icon:         '🎬',
    hint:         'Paste the shared Drive folder containing all 4 videos.',
  },
  // "Create 1 static image for {product}"
  static: {
    titlePrefix:  'Create 1 static image for ',
    field:        'images_drive_url',
    label:        'Image Drive URL',
    placeholder:  'https://drive.google.com/file/d/…',
    assetSection: 'Images',
    icon:         '🖼️',
    hint:         'Paste the Drive link to the static image file.',
  },
}

// Internal ordered list for iteration
const CONFIGS = Object.values(DELIVERABLE_CONFIG)

/**
 * Given a task title, returns its deliverable config or null.
 * Matches by title prefix (case-sensitive, as set by workflow automation).
 *
 * @param   {string} taskTitle
 * @returns {object|null}
 */
export function getDeliverableConfig(taskTitle) {
  if (!taskTitle) return null
  return CONFIGS.find(c => taskTitle.startsWith(c.titlePrefix)) || null
}

/**
 * Returns an error message string if the task is a deliverable type
 * and the URL field is empty, otherwise returns null.
 *
 * @param   {string} taskTitle
 * @param   {string} deliverableUrl
 * @returns {string|null}
 */
export function validateDeliverable(taskTitle, deliverableUrl) {
  const config = getDeliverableConfig(taskTitle)
  if (!config) return null                           // not a deliverable task
  if (!deliverableUrl || !deliverableUrl.trim()) {
    return `"${config.label}" is required before marking this task as Done.`
  }
  return null
}

/**
 * Upserts a single asset URL into product_assets for the given product.
 * Uses upsert with onConflict:'product_name' to create or update safely.
 * Only sets the specific column for this task type — never touches others.
 *
 * @param {string} productName      - matches products.name
 * @param {string} taskTitle        - used to determine which column to set
 * @param {string} deliverableUrl   - the URL provided by Saida
 */
export async function saveDeliverableAsset(productName, taskTitle, deliverableUrl) {
  if (!productName || !deliverableUrl?.trim()) return

  const config = getDeliverableConfig(taskTitle)
  if (!config) return  // not a deliverable task, nothing to save

  const url = deliverableUrl.trim()

  // Build the upsert payload — only the specific asset field for this task
  const payload = {
    product_name:   productName,
    [config.field]: url,
  }

  const { error } = await supabase
    .from('product_assets')
    .upsert(payload, { onConflict: 'product_name' })

  if (error) {
    console.warn('[Deliverables] Failed to save asset:', error.message)
    throw error
  }
}
