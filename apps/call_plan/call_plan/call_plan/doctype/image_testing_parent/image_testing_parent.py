# Copyright (c) 2024, Nadine Verelia and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class imagetestingparent(Document):
	def on_update(self):
		self.test='on_update'
	""" def before_save(self):
		self.test='before save 1' """
