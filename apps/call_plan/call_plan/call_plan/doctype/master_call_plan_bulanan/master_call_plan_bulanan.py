# Copyright (c) 2024, Nadine Verelia and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
import frappe

class MasterCallPlanbulanan(Document):
	@frappe.whitelist()
	def get_merchant_list(self,planned_merchant):
		unplanned_merchant = frappe.get_list("Merchants", fields=['merchant_name'], filters={'merchant_code': ['not in', planned_merchant]},pluck='merchant_name',order_by='merchant_name')
		return unplanned_merchant
