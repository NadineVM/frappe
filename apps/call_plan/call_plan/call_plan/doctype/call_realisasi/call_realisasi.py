# Copyright (c) 2024, Nadine Verelia and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
import frappe


class CallRealisasi(Document):
	@frappe.whitelist()
	def get_merchant(self,master_plan):
		merchants = frappe.db.get_all("Master Call Plan copy", fields=['merchant_name'], filters={'parent': master_plan,'status_plan':['in',['Belum realisasi','Sedang realisasi']]},pluck='merchant_name',order_by='merchant_name')
		return merchants
	@frappe.whitelist()
	def get_tanggal(self,master_plan,merchant_name):
		plan,frekuensi=frappe.db.get_value('Master Call Plan copy',{'parent':master_plan,'merchant_name':merchant_name},['name','frekuensi'])
		opsi_tanggal=[]
		for i in range(int(frekuensi)):
			if (frappe.db.get_value('Master Call Plan copy',plan,f'status_{i+1}')=='Belum realisasi'):
				item_tanggal=str(frappe.db.get_value('Master Call Plan copy',plan,f'kunjungan_{i+1}'))
				tahun,bulan,tanggal=item_tanggal.split('-')
				opsi_tanggal.append(f'{tanggal}-{bulan}-{tahun}')
		return opsi_tanggal
	@frappe.whitelist()
	def set_status_tanggal(self,master_plan,merchant_name,tanggal_target,status_completion):
		plan,frekuensi=frappe.db.get_value('Master Call Plan copy',{'parent':master_plan,'merchant_name':merchant_name},['name','frekuensi'])
		for i in range(int(frekuensi)):
			item_tanggal=str(frappe.db.get_value('Master Call Plan copy',plan,f'kunjungan_{i+1}'))
			tahun,bulan,tanggal=item_tanggal.split('-')
			if tanggal_target==f'{tanggal}-{bulan}-{tahun}' :
				frappe.db.set_value('Master Call Plan copy', plan, f'status_{i+1}', status_completion)
				frappe.db.commit()
				break
		self.cek_overall_status(plan,frekuensi)

	def cek_overall_status(self,plan,frekuensi):
		current_status=frappe.db.get_value('Master Call Plan copy',plan,'status_plan')
		#jika status plan belum realisasi, jika salah satu kunjungan sudah realisasi, ganti status menjadi sedang realisasi
		if current_status=='Belum realisasi':
			if frekuensi>1:
				for i in range(int(frekuensi)):
					if frappe.db.get_value('Master Call Plan copy',plan,f'status_{i+1}')!='Belum realisasi':
						frappe.db.set_value('Master Call Plan copy', plan, 'status_plan', 'Sedang realisasi')
						frappe.db.commit()
						break
			elif frekuensi==1:
				if frappe.db.get_value('Master Call Plan copy',plan,f'status_1')!='Belum realisasi':
						frappe.db.set_value('Master Call Plan copy', plan, 'status_plan', 'Sudah realisasi')
						frappe.db.commit()
		#jika status plan sedang realisasi, jika semua kunjungan sudah realisasi, ganti jadi sudah realisasi. jika semua kunjungan belum realisasi, ganti jadi belum realisasi
		elif current_status=='Sedang realisasi':
			belum_realisasi=0
			for i in range(int(frekuensi)):
				if frappe.db.get_value('Master Call Plan copy',plan,f'status_{i+1}')=='Belum realisasi':
					belum_realisasi=belum_realisasi+1
			if belum_realisasi==0:
				frappe.db.set_value('Master Call Plan copy', plan, 'status_plan', 'Sudah realisasi')
				frappe.db.commit()
			if belum_realisasi==frekuensi:
				frappe.db.set_value('Master Call Plan copy', plan, 'status_plan', 'Belum realisasi')
				frappe.db.commit()
		#jika status plan sudah realisasi, jika salah satu kunjungan belum realisasi, ganti status menjadi sedang realisasi
		elif current_status=='Sudah realisasi':
			if frekuensi>1:
				for i in range(int(frekuensi)):
					if frappe.db.get_value('Master Call Plan copy',plan,f'status_{i+1}')=='Belum realisasi':
						frappe.db.set_value('Master Call Plan copy', plan, 'status_plan', 'Sedang realisasi')
						frappe.db.commit()
						break
			elif frekuensi==1:
				if frappe.db.get_value('Master Call Plan copy',plan,f'status_1')=='Belum realisasi':
						frappe.db.set_value('Master Call Plan copy', plan, 'status_plan', 'Belum realisasi')
						frappe.db.commit()

		""" plan_name,frekuensi=frappe.db.get_value('Master Call Plan copy',{'parent':master_plan,'merchant_name':merchant_name},['name','frekuensi'])
		plan=frappe.get_doc('Master Call Plan copy',plan_name)
		for i in range(int(frekuensi)):
			if tanggal_target==str(frappe.db.get_value('Master Call Plan copy',plan_name,f'kunjungan_{i+1}')):
				plan.set(f'kunjungan_{i+1}_status','Done')
				plan.save()
				break """


