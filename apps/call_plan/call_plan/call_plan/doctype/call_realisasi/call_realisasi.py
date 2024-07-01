# Copyright (c) 2024, Nadine Verelia and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
import frappe


class CallRealisasi(Document):
	@frappe.whitelist()
	def get_tanggal(self,call):
		jumlah_kunjungan=int(frappe.db.get_value('Master Call Plan copy',call,'frekuensi'))
		opsi_tanggal=''
		for i in range(jumlah_kunjungan):
			tanggal=str(frappe.db.get_value('Master Call Plan copy',call,f'kunjungan_{i+1}'))
			opsi_tanggal=opsi_tanggal+tanggal+'\n'
		return opsi_tanggal
	""" def set_status_tanggal(self, call, no_status):
		frappe.db.set_value('Master Call Plan copy',call,no_status,'Sudah direalisasi') """

