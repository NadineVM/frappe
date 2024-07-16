class CallRealisasi(Document):
	#return merchant yang ada di master plan & status overall belum/sedang realisasi
	@frappe.whitelist()
	def get_merchant(self,master_plan):
		merchants = frappe.db.get_all("Call Planning", fields=['merchant_name'], filters={'parent': master_plan,'status_plan':['in',['Belum realisasi','Sedang realisasi']]},pluck='merchant_name',order_by='merchant_name')
		return merchants
	#return list tanggal kunjungan berdasarkan master plan dan merchant yang dipilih
	@frappe.whitelist()
	def get_tanggal(self,master_plan,merchant_name):
		plan,frekuensi=frappe.db.get_value('Call Planning',{'parent':master_plan,'merchant_name':merchant_name},['name','frekuensi'])
		opsi_tanggal=[]
		for i in range(int(frekuensi)):
			if (frappe.db.get_value('Call Planning',plan,f'status_{i+1}')=='Belum realisasi'):
				item_tanggal=str(frappe.db.get_value('Call Planning',plan,f'kunjungan_{i+1}'))
				tahun,bulan,tanggal=item_tanggal.split('-')
				opsi_tanggal.append(f'{tanggal}-{bulan}-{tahun}')
		return opsi_tanggal
	@frappe.whitelist()
	def set_status_tanggal(self,master_plan,merchant_name,tanggal_target,status_completion):
		plan,frekuensi=frappe.db.get_value('Call Planning',{'parent':master_plan,'merchant_name':merchant_name},['name','frekuensi'])
		for i in range(int(frekuensi)):
			item_tanggal=str(frappe.db.get_value('Call Planning',plan,f'kunjungan_{i+1}'))
			tahun,bulan,tanggal=item_tanggal.split('-')
			if tanggal_target==f'{tanggal}-{bulan}-{tahun}' :
				frappe.db.set_value('Call Planning', plan, f'status_{i+1}', status_completion)
				frappe.db.commit()
				break
		self.cek_overall_status(plan,int(frekuensi)) #update overall status plan setiap ada perubahan pada status tanggal kunjungan

	def cek_overall_status(self,plan,frekuensi):
		current_status=frappe.db.get_value('Call Planning',plan,'status_plan')
		#jika status plan belum realisasi, jika salah satu kunjungan sudah realisasi, ganti status menjadi sedang realisasi
		if current_status=='Belum realisasi':
			if frekuensi>1:
				for i in range(frekuensi):
					if frappe.db.get_value('Call Planning',plan,f'status_{i+1}')!='Belum realisasi':
						frappe.db.set_value('Call Planning', plan, 'status_plan', 'Sedang realisasi')
						frappe.db.commit()
						break
			elif frekuensi==1:
				if frappe.db.get_value('Call Planning',plan,f'status_1')!='Belum realisasi':
						frappe.db.set_value('Call Planning', plan, 'status_plan', 'Sudah realisasi')
						frappe.db.commit()
		#jika status plan sedang realisasi, jika semua kunjungan sudah realisasi, ganti jadi sudah realisasi. jika semua kunjungan belum realisasi, ganti jadi belum realisasi
		elif current_status=='Sedang realisasi':
			belum_realisasi=0
			for i in range(int(frekuensi)):
				if frappe.db.get_value('Call Planning',plan,f'status_{i+1}')=='Belum realisasi':
					belum_realisasi=belum_realisasi+1
			if belum_realisasi==0:
				frappe.db.set_value('Call Planning', plan, 'status_plan', 'Sudah realisasi')
				frappe.db.commit()
			if belum_realisasi==frekuensi:
				frappe.db.set_value('Call Planning', plan, 'status_plan', 'Belum realisasi')
				frappe.db.commit()
		#jika status plan sudah realisasi, jika salah satu kunjungan belum realisasi, ganti status menjadi sedang realisasi
		elif current_status=='Sudah realisasi':
			if frekuensi>1:
				for i in range(int(frekuensi)):
					if frappe.db.get_value('Call Planning',plan,f'status_{i+1}')=='Belum realisasi':
						frappe.db.set_value('Call Planning', plan, 'status_plan', 'Sedang realisasi')
						frappe.db.commit()
						break
			elif frekuensi==1:
				if frappe.db.get_value('Call Planning',plan,f'status_1')=='Belum realisasi':
						frappe.db.set_value('Call Planning', plan, 'status_plan', 'Belum realisasi')
						frappe.db.commit()
						
#############################################MASTER CALL PLAN CODE################################################################
class MasterCallPlanbulanan(Document):
	@frappe.whitelist()
	def get_merchant_list(self,planned_merchant,pr):
		unplanned_merchant = frappe.get_list("Merchants", fields=['merchant_name'], filters={'merchant_code': ['not in', planned_merchant],'pic_pr':pr},pluck='merchant_name',order_by='merchant_name')
		return unplanned_merchant
	@frappe.whitelist()
	def get_pr_of_asm(self,asm):
		spar_list=frappe.get_list("Klasifikasi PIC Merchant", filters={'parent_klasifikasi_pic_merchant': asm},pluck='name')
		pr_list=frappe.get_list("Klasifikasi PIC Merchant", filters={'parent_klasifikasi_pic_merchant': ['in', spar_list]},pluck='name',order_by='kode_pic')
		return pr_list
	@frappe.whitelist()
	def get_call_realisasi(self,master_plan,merchant_name,tanggal_kunjungan):
		realisasi=frappe.db.get_value('Call Realisasi',{'master_plan':master_plan,'nama_merchantklinik':merchant_name,'tanggal_target':tanggal_kunjungan},['name'])
		return realisasi
@frappe.whitelist()
def get_call():
	kunjungan_1=frappe.db.get_all('Call Planning',fields=["merchant_name.merchant_name","kunjungan_1 AS tanggal_kunjungan","name"])
	for item in kunjungan_1:
		item['merchant_name']=item['merchant_name']+'(1)' 
		item['color']='#B9D1C0'
	kunjungan_2=frappe.db.get_all('Call Planning',fields=["merchant_name.merchant_name","kunjungan_2 AS tanggal_kunjungan","name"])
	for item in kunjungan_2:
		item['merchant_name']=item['merchant_name']+'(2)' 
		item['color']='#D1D1B9'
	kunjungan_3=frappe.db.get_all('Call Planning',fields=["merchant_name.merchant_name","kunjungan_3 AS tanggal_kunjungan","name"])
	for item in kunjungan_3:
		item['merchant_name']=item['merchant_name']+'(3)' 
		item['color']='#B9C6D1'
	kunjungan_4=frappe.db.get_all('Call Planning',fields=["merchant_name.merchant_name","kunjungan_4 AS tanggal_kunjungan","name"])
	for item in kunjungan_4:
		item['merchant_name']=item['merchant_name']+'(4)'
		item['color']='#D1B9D0' 
	data=kunjungan_1+kunjungan_2+kunjungan_3+kunjungan_4
	return data
