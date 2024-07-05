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

@frappe.whitelist()
def get_call():
	#data = frappe.db.sql("""
	#	SELECT CONCAT(merchant_name, '-1') as subject, kunjungan_1 as tanggal_kunjungan, name FROM `tabMaster Call Plan copy` UNION 
	#	SELECT CONCAT(merchant_name, '-2') as subject, kunjungan_2 as tanggal_kunjungan, name FROM `tabMaster Call Plan copy` UNION
	#	SELECT CONCAT(merchant_name, '-3') as subject, kunjungan_3 as tanggal_kunjungan, name FROM `tabMaster Call Plan copy` UNION
	#	SELECT CONCAT(merchant_name, '-4') as subject, kunjungan_4 as tanggal_kunjungan, name FROM `tabMaster Call Plan copy`
	#	""", as_dict=True)
	#data=frappe.db.get_all('Master Call Plan copy',fields=["merchant_name.merchant_name","kunjungan_1 AS tanggal_kunjungan","name"])+frappe.db.get_all('Master Call Plan copy',fields=["merchant_name.merchant_name","kunjungan_2 AS tanggal_kunjungan","name"])+frappe.db.get_all('Master Call Plan copy',fields=["merchant_name.merchant_name","kunjungan_3 AS tanggal_kunjungan","name"])+frappe.db.get_all('Master Call Plan copy',fields=["merchant_name.merchant_name","kunjungan_4 AS tanggal_kunjungan","name"])
	kunjungan_1=frappe.db.get_all('Master Call Plan copy',fields=["merchant_name.merchant_name","kunjungan_1 AS tanggal_kunjungan","name"])
	for item in kunjungan_1:
		item['merchant_name']=item['merchant_name']+'(1)' 
		item['color']='#B9D1C0'
	kunjungan_2=frappe.db.get_all('Master Call Plan copy',fields=["merchant_name.merchant_name","kunjungan_2 AS tanggal_kunjungan","name"])
	for item in kunjungan_2:
		item['merchant_name']=item['merchant_name']+'(2)' 
		item['color']='#D1D1B9'
	kunjungan_3=frappe.db.get_all('Master Call Plan copy',fields=["merchant_name.merchant_name","kunjungan_3 AS tanggal_kunjungan","name"])
	for item in kunjungan_3:
		item['merchant_name']=item['merchant_name']+'(3)' 
		item['color']='#B9C6D1'
	kunjungan_4=frappe.db.get_all('Master Call Plan copy',fields=["merchant_name.merchant_name","kunjungan_4 AS tanggal_kunjungan","name"])
	for item in kunjungan_4:
		item['merchant_name']=item['merchant_name']+'(4)'
		item['color']='#D1B9D0' 
	data=kunjungan_1+kunjungan_2+kunjungan_3+kunjungan_4
	return data
