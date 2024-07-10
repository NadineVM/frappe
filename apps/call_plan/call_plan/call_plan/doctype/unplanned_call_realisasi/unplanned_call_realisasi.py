# Copyright (c) 2024, Nadine Verelia and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from call_plan.call_plan.rabbitmq.rabbitmq_publisher import send_to_rabbitmq


class UnplannedCallRealisasi(Document):
	def on_update(self):
		frappe.msgprint("Data berhasil diupdate")
		send_to_rabbitmq(self, 'update')
