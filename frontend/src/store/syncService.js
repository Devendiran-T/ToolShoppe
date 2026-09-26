/**
 * syncService.js
 * Synchronizes frontend actions to the FastAPI REST backend
 * and normalizes backend relational models into the UI state format.
 */

import {
  mastersApi,
  salesApi,
  purchaseApi,
} from '../api/endpoints.js'

export function mapBackendToFrontend(bData, fallback) {
  if (!bData) return fallback

  const s = { ...fallback }

  // 1. Customers
  if (Array.isArray(bData.customers) && bData.customers.length > 0) {
    s.customers = bData.customers.map((c) => ({
      id: c.id,
      code: c.customer_code || c.code || `CUS-${c.id}`,
      name: c.name || '',
      contactPerson: c.contact_person || c.contactPerson || '',
      phone: c.phone || '',
      email: c.email || '',
      gstin: c.gstin || '',
      billingAddress: c.billing_address || c.billingAddress || '',
      shippingAddress: c.shipping_address || c.shippingAddress || '',
      markupPct: Number(c.default_markup ?? c.markupPct ?? 15),
      paymentTerms: c.payment_terms || c.paymentTerms || '30 days',
      active: c.status !== false && c.active !== false,
    }))
  }

  // 2. Suppliers
  if (Array.isArray(bData.suppliers) && bData.suppliers.length > 0) {
    s.suppliers = bData.suppliers.map((sup) => ({
      id: sup.id,
      code: sup.supplier_code || sup.code || `SUP-${sup.id}`,
      name: sup.name || '',
      contactPerson: sup.contact_person || sup.contactPerson || '',
      phone: sup.phone || '',
      email: sup.email || '',
      categories: sup.categories || '',
      leadTimeDays: Number(sup.lead_time_days ?? sup.leadTimeDays ?? 5),
      active: sup.status !== false && sup.active !== false,
    }))
  }

  // 3. Items
  if (Array.isArray(bData.items) && bData.items.length > 0) {
    s.items = bData.items.map((it) => ({
      id: it.id,
      code: it.item_code || it.code || `ITM-${it.id}`,
      name: it.name || '',
      description: it.description || '',
      category: it.category || 'General',
      unit: it.unit || 'Nos',
      hsn: it.hsn_code || it.hsn || '',
      taxPct: Number(it.tax_percent ?? it.taxPct ?? 18),
      lastPurchaseRate: Number(it.last_purchase_rate ?? it.lastPurchaseRate ?? 0),
      active: it.status !== false && it.active !== false,
    }))
  }

  // 4. Customer Requests
  if (Array.isArray(bData.customerRequests) && bData.customerRequests.length > 0) {
    s.customerRequests = bData.customerRequests.map((cr) => ({
      id: cr.id,
      crNo: cr.request_no || cr.crNo || `CR-${cr.id}`,
      date: (cr.created_at || '').slice(0, 10) || cr.date,
      customerId: cr.customer_id || cr.customerId,
      requiredBy: cr.required_date || cr.requiredBy,
      reference: cr.customer_reference || cr.reference || '',
      stage: cr.status || cr.stage || 'Requested',
      lines: (cr.lines || []).map((l) => ({
        itemId: l.item_id || l.itemId,
        description: l.description || '',
        qty: Number(l.quantity ?? l.qty ?? 1),
        unit: l.unit || 'Nos',
      })),
    }))
  }

  return s
}

/**
 * Dispatches an action asynchronously to the FastAPI backend.
 */
export async function syncActionToBackend(action, state) {
  try {
    switch (action.type) {
      /* Masters */
      case 'MASTER_SAVE': {
        const { collection, record } = action
        if (collection === 'customers') {
          const payload = {
            name: record.name,
            contact_person: record.contactPerson,
            phone: record.phone,
            email: record.email,
            gstin: record.gstin,
            billing_address: record.billingAddress,
            shipping_address: record.shippingAddress,
            default_markup: Number(record.markupPct || 15),
            payment_terms: record.paymentTerms,
            status: record.active !== false,
          }
          if (typeof record.id === 'number') {
            await mastersApi.updateCustomer(record.id, payload)
          } else {
            await mastersApi.createCustomer(payload)
          }
        } else if (collection === 'suppliers') {
          const payload = {
            name: record.name,
            contact_person: record.contactPerson,
            phone: record.phone,
            email: record.email,
            categories: record.categories,
            lead_time_days: Number(record.leadTimeDays || 5),
            status: record.active !== false,
          }
          if (typeof record.id === 'number') {
            await mastersApi.updateSupplier(record.id, payload)
          } else {
            await mastersApi.createSupplier(payload)
          }
        } else if (collection === 'items') {
          const payload = {
            name: record.name,
            description: record.description,
            category: record.category,
            unit: record.unit,
            hsn_code: record.hsn,
            tax_percent: Number(record.taxPct || 18),
            last_purchase_rate: Number(record.lastPurchaseRate || 0),
            status: record.active !== false,
          }
          if (typeof record.id === 'number') {
            await mastersApi.updateItem(record.id, payload)
          } else {
            await mastersApi.createItem(payload)
          }
        }
        break
      }

      case 'MASTER_TOGGLE': {
        const { collection, id } = action
        if (typeof id === 'number') {
          if (collection === 'customers') await mastersApi.toggleCustomer(id)
          if (collection === 'suppliers') await mastersApi.toggleSupplier(id)
          if (collection === 'items') await mastersApi.toggleItem(id)
        }
        break
      }

      /* Sales - 01. Customer Request */
      case 'CR_CREATE': {
        const { payload } = action
        if (typeof payload.customerId === 'number') {
          await salesApi.createCustomerRequest({
            customer_id: payload.customerId,
            required_date: payload.requiredBy || undefined,
            customer_reference: payload.reference || undefined,
            lines: (payload.lines || []).map((l) => ({
              item_id: l.itemId,
              description: l.description,
              quantity: Number(l.qty || 1),
              unit: l.unit || 'Nos',
            })),
          })
        }
        break
      }

      /* Purchase - 02. RFQ */
      case 'PR_SEND_RFQ': {
        const { prId, supplierIds, subject, body } = action
        if (typeof prId === 'number') {
          await purchaseApi.sendRFQ({
            pr_id: prId,
            supplier_ids: supplierIds,
            subject,
            body,
          })
        }
        break
      }

      /* Purchase - 03. Vendor Quotation */
      case 'VQ_SAVE': {
        const { payload } = action
        if (typeof payload.prId === 'number' && typeof payload.supplierId === 'number') {
          await purchaseApi.createVendorQuotation({
            purchase_request_id: payload.prId,
            supplier_id: payload.supplierId,
            quote_reference: payload.quoteRef,
            quote_date: payload.quoteDate,
            validity: payload.validTill,
            delivery_days: Number(payload.deliveryDays || 0),
            payment_terms: payload.paymentTerms,
            freight: Number(payload.freight || 0),
            lines: (payload.lines || []).map((l) => ({
              item_id: l.itemId,
              rate: Number(l.rate || 0),
              tax_percent: Number(l.taxPct || 18),
              not_quoted: Boolean(l.notQuoted),
            })),
          })
        }
        break
      }

      /* Purchase - 04. Quotation Comparison Approval */
      case 'QC_APPROVE': {
        const { qcId, selectedVqId, overrideReason } = action
        const qc = state.quotationComparisons.find((q) => q.id === qcId)
        if (qc && typeof qc.prId === 'number') {
          const vq = state.vendorQuotations.find((v) => v.id === selectedVqId)
          if (vq) {
            await purchaseApi.approveComparison(qc.prId, {
              selected_supplier_id: vq.supplierId,
              override_reason: overrideReason || undefined,
            })
          }
        }
        break
      }

      /* Sales - 05. Customer Quotation Status */
      case 'CQ_SET_STATUS': {
        const { cqId, status } = action
        if (typeof cqId === 'number') {
          if (status === 'Accepted') await salesApi.acceptCustomerQuotation(cqId)
          if (status === 'Rejected') await salesApi.rejectCustomerQuotation(cqId)
        }
        break
      }

      /* Sales - 06. Customer Order (SO) */
      case 'SO_CREATE': {
        const { payload } = action
        if (typeof payload.cqId === 'number') {
          await salesApi.createCustomerOrder({
            quotation_id: payload.cqId,
            customer_po_number: payload.customerPoNo,
            po_date: payload.customerPoDate,
            delivery_date: payload.deliveryDate,
            items: (payload.lines || []).map((l) => ({
              item_id: l.itemId,
              quantity: Number(l.qty || 1),
              selling_price: Number(l.price || 0),
            })),
          })
        }
        break
      }

      /* Purchase - 07. Supplier PO Send */
      case 'PO_SEND': {
        const { poId, subject, body } = action
        if (typeof poId === 'number') {
          await purchaseApi.sendPurchaseOrder(poId, { subject, body })
        }
        break
      }

      /* Purchase - 08. GRN */
      case 'GRN_CREATE': {
        const { payload } = action
        if (typeof payload.poId === 'number') {
          await purchaseApi.createGRN({
            purchase_order_id: payload.poId,
            challan_no: payload.supplierRef || 'CH-001',
            received_date: payload.date,
            received_by: payload.receivedBy || 'Stores',
            remarks: payload.remarks,
            items: (payload.lines || []).map((l) => ({
              item_id: l.itemId,
              received_qty: Number(l.receivedQty || 0),
              accepted_qty: Number(l.acceptedQty || 0),
              rejected_qty: Number(l.rejectedQty || 0),
            })),
          })
        }
        break
      }

      /* Purchase - 09. Inward */
      case 'INW_ADD_TO_STOCK': {
        const { inwId } = action
        if (typeof inwId === 'number') {
          await purchaseApi.inwardStock(inwId)
        }
        break
      }

      /* Sales - 10. Outward (Delivery Challan) */
      case 'OUT_CREATE': {
        const { payload } = action
        if (typeof payload.soId === 'number') {
          await salesApi.createOutward({
            customer_order_id: payload.soId,
            dc_number: payload.dcNo || 'DC-001',
            dispatch_date: payload.date,
            dispatch_mode: payload.mode || 'Road',
            vehicle_or_courier: payload.vehicle,
            remarks: payload.remarks,
            items: (payload.lines || []).map((l) => ({
              item_id: l.itemId,
              dispatch_qty: Number(l.qty || 0),
            })),
          })
        }
        break
      }

      /* Sales - 11. Sales Invoice */
      case 'SI_CREATE': {
        const { payload } = action
        if (typeof payload.outId === 'number') {
          await salesApi.createSalesInvoice({
            outward_id: payload.outId,
            invoice_date: payload.date,
            due_date: payload.dueDate,
            payment_terms: payload.paymentTerms || '30 days',
          })
        }
        break
      }

      /* Purchase - 12. Purchase Invoice */
      case 'PI_CREATE': {
        const { payload } = action
        if (typeof payload.grnId === 'number') {
          await purchaseApi.createPurchaseInvoice({
            grn_id: payload.grnId,
            supplier_invoice_no: payload.supplierInvNo || 'PINV-001',
            supplier_invoice_date: payload.supplierInvDate || payload.date,
            due_date: payload.dueDate,
          })
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.warn(`[SyncService] Backend sync notice for ${action.type}:`, err.message || err)
  }
}
