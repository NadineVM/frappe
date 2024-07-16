// Copyright (c) 2024, Nadine Verelia and contributors
// For license information, please see license.txt

//declare toleransi perbedaan longitude&latitude antara call dan merchant
var toleransi_dalam_meter=50

frappe.ui.form.on("Call Realisasi", {
	//dapatkan opsi tanggal yang belum direalisasi berdasarkan master plan dan nama merchant
	get_opsi_tanggal(frm){
		if(frm.doc.nama_merchantklinik&&frm.doc.master_plan){
		frm.call('get_tanggal',{master_plan:frm.doc.master_plan,merchant_name:frm.doc.nama_merchantklinik}).then(opsi_tanggal =>{
			frm.set_df_property('tanggal_target','options',opsi_tanggal.message)
		})}
	},

	//dapatkan merchant yang belum atau sedang direalisasi (eliminate yang sudah realisasi)
	set_filter_merchant(frm){
		if(frm.doc.master_plan){
			frm.call('get_merchant',{master_plan:frm.doc.master_plan}).then(merchants =>{
				frm.set_query('nama_merchantklinik',()=>{
					return{
						'filters':{
							'merchant_code':['in',merchants.message]
						}
					}
				})
			})
		}
	},

	//set map lokasi merchant
	//akan ditrigger setiap refresh dan perubahan merchant & jenis kunjungan
	set_map_merchant(frm) {
		if(frm.doc.jenis_kunjungan=='Offline'&&frm.doc.nama_merchantklinik){
			let html =
				//`<iframe src='https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1345.0290787498923!2d${frm.doc.merch_longitude}!3d${frm.doc.merch_latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sid!4v1717991438573!5m2!1sen!2sid' width='600' height='450' style='border:0;' allowfullscreen='' loading='lazy' referrerpolicy='no-referrer-when-downgrade'></iframe> `;
				`<iframe src='https://maps.google.com/maps?q=${frm.doc.merch_latitude},${frm.doc.merch_longitude}&t=&z=17&ie=UTF8&iwloc=&output=embed' width='80%' height="300" id="gmap_canvas"></iframe>`;
			frm.set_df_property("locationmerchant", "options", html);}
	},

	//cek kesesuaian lokasi merchant dan call, dengan toleransi yang sudah diset
	//dipanggil ketika take photo, karena saat lokasi call akan diambil

	//sesuaikan dgn code di development, masukan di ketika photo diambil (hanya untuk offline)
	cek_lokasi(frm){
		let merch_latitude=Number(frm.doc.merch_latitude)
		let merch_longitude=Number(frm.doc.merch_longitude)
		let call_latitude=Number(frm.doc.call_latitude)
		let call_longitude=Number(frm.doc.call_longitude)
		let toleransi_latitude=(toleransi_dalam_meter / 6378000) * (180 / Math.PI)
		let toleransi_longitude=(toleransi_dalam_meter / 6378000) * (180 / Math.PI)/Math.cos(Number(merch_latitude)*Math.PI/180)

		if (call_latitude> merch_latitude+ toleransi_latitude || call_latitude< merch_latitude-toleransi_latitude||
			call_longitude> merch_longitude+ toleransi_longitude || call_longitude<merch_longitude-toleransi_longitude
		){
			frappe.msgprint(__('Lokasi anda tidak sesuai dengan lokasi merchant'));
			frm.set_value('kesesuaian_lokasi','Tidak Sesuai')
		}
		else{
			frm.set_value('kesesuaian_lokasi','Sesuai')
		}
	},

	tampilkan_foto(frm){
		//tampilkan attachment di field html
		let file_list=frm.get_files()
		//convert file to html
		function convert_to_html(file){
			return `<img src="${file.file_url}" style="width:100px;height:100px;">`
		}
		let img_list=file_list.map(convert_to_html)
		//set as options in tampilan foto field
		frm.set_df_property('tampilan_foto','options',`<div>${img_list.join(' ')}<div>`)
	},

	////di bawah ini akan berjalan sesuai form events (eg refresh, submit, ketika suatu field diubah) 
	
	//perlu klik mulai realisasi sebelum save
	validate(frm){
		if(!frm.doc.tanggal_kunjungan){
			frappe.msgprint(__('Mulai realisasi belum diklik'));
			frappe.validated=false; //gagalkan save
		}
	},

	//perlu setidaknya 1 attachment untuk submit
	before_submit(frm){
        let attachments=frm.get_files();
		if (attachments.length==0){
		    frappe.throw(__('Harus menyertakan minimal 1 foto'))
		}
	}
	,
	refresh(frm) {
		frm.set_df_property('locationmerchant','options',' ')
		frm.trigger('set_map_merchant')
		if (frm.doc.tanggal_kunjungan) {
			frm.fields_dict.mulai_realisasi.toggle(false);
			}
		//frm.trigger("get_call_location");
		if (frm.doc.docstatus==0){
			frm.set_query('master_plan',()=>{
				return{
				'filters':{
					'workflow_state': 'Approved'
					}
				}
			})
			frm.trigger('set_filter_merchant')
			frm.trigger('get_opsi_tanggal')
		}
		//kalau sdh submitted/cancelled
		else{
			frm.trigger('tampilkan_foto')
		}
	},

	//MEKANISME STATUS

	//(1) jika realisasi disubmit maka status tanggal kunjungan di master plan akan diubah menjadi 'sudah realisasi','sudah realisasi(... tidak sesuai)' 
	on_submit(frm){
		if (frm.doc.kesesuaian_tanggal=='Tidak Sesuai'&&frm.doc.kesesuaian_lokasi=='Sesuai'){
			frm.call('set_status_tanggal',{master_plan:frm.doc.master_plan,merchant_name:frm.doc.nama_merchantklinik,tanggal_target:frm.doc.tanggal_target,status_completion:'Sudah realisasi (tanggal tidak sesuai)'})}
		else if (frm.doc.kesesuaian_lokasi=='Tidak Sesuai'&&frm.doc.kesesuaian_tanggal=='Sesuai'){
			frm.call('set_status_tanggal',{master_plan:frm.doc.master_plan,merchant_name:frm.doc.nama_merchantklinik,tanggal_target:frm.doc.tanggal_target,status_completion:'Sudah realisasi (lokasi tidak sesuai)'})}		
		else if(frm.doc.kesesuaian_tanggal=='Tidak Sesuai'&&frm.doc.kesesuaian_lokasi=='Tidak Sesuai'){
			frm.call('set_status_tanggal',{master_plan:frm.doc.master_plan,merchant_name:frm.doc.nama_merchantklinik,tanggal_target:frm.doc.tanggal_target,status_completion:'Sudah realisasi (tanggal dan lokasi tidak sesuai)'})}
		else {
			frm.call('set_status_tanggal',{master_plan:frm.doc.master_plan,merchant_name:frm.doc.nama_merchantklinik,tanggal_target:frm.doc.tanggal_target,status_completion:'Sudah realisasi'})}
		frm.trigger('tampilkan_foto')

	},

	//(2) jika realisasi dicancel atau didiscard maka status tanggal kunjungan di master plan akan diubah menjadi 'belum realisasi'
	before_cancel(frm){
		frm.call('set_status_tanggal',{master_plan:frm.doc.master_plan,merchant_name:frm.doc.nama_merchantklinik,tanggal_target:frm.doc.tanggal_target,status_completion:'Belum realisasi'})
	},
	before_discard(frm){
		frm.call('set_status_tanggal',{master_plan:frm.doc.master_plan,merchant_name:frm.doc.nama_merchantklinik,tanggal_target:frm.doc.tanggal_target,status_completion:'Belum realisasi'})
	},

	master_plan(frm) {
		//ubah filter merchant sesuai perubahan master plan
		frm.trigger('set_filter_merchant')
		//reset nama merchant dan tanggal kunjungan jika ada perubahan master plan
		if(frm.doc.tanggal_kunjungan){
		    frm.fields_dict.mulai_realisasi.toggle(true); //button 'mulai realisasi' ditampilkan kembali
		    frm.set_value('tanggal_kunjungan','')}
			frm.set_value('kesesuaian_tanggal','');
		
		if(frm.doc.nama_merchantklinik){
			frm.set_value('nama_merchantklinik','')}
	},

	nama_merchantklinik(frm){
		frm.trigger('get_opsi_tanggal')
		frm.trigger('set_map_merchant')
		//reset tanggal kunjungan jika ada perubahan merchant
		if(frm.doc.tanggal_kunjungan){
		    frm.fields_dict.mulai_realisasi.toggle(true);
		    frm.set_value('tanggal_kunjungan','')}
			frm.set_value('kesesuaian_tanggal','');
		//reset kesesuaian lokasi utk perubahan merchant
        if(frm.doc.kesesuaian_lokasi){
            frm.trigger("cek_lokasi")}
	},

	//lock tanggal dan waktu kunjungan
	mulai_realisasi(frm) {
		function format(num, len = 2) { //formating waktu misal '5' menjadi '05'
			return `${num}`.padStart(len, '0');
		  }
		let currentTime = new Date();
		let hours=format(currentTime.getHours())
        let minutes=format(currentTime.getMinutes())
		let seconds=format(currentTime.getSeconds())
        let month=format(currentTime.getMonth()+1)
		let date=format(currentTime.getDate())
        let year=format(currentTime.getFullYear())
		if (frm.doc.tanggal_target!=`${date}-${month}-${year}`){ //jika tanggal hari ini tidak sama dengan tanggal target
			frappe.confirm('Tanggal target kunjungan tidak sama dengan tanggal hari ini, lanjutkan?',function(){
				frm.fields_dict.mulai_realisasi.toggle(false);
				frm.set_value("tanggal_kunjungan", `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`);
				frm.set_value('kesesuaian_tanggal','Tidak Sesuai'); //set kesesuaian tanggal menjadi tidak sesuai
			})
		}
		else{
			frm.fields_dict.mulai_realisasi.toggle(false);
			frm.set_value("tanggal_kunjungan", `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`)
			frm.set_value('kesesuaian_tanggal','Sesuai');
		}
	},

	jenis_kunjungan(frm){
		frm.trigger('set_map_merchant')
	},
	

	photo(frm){
		//delete saat transfer//
		frm.set_value('call_longitude','106.7126565')
		frm.set_value('call_latitude','-6.2725422')
		//delete saat transfer//
		frm.trigger('cek_lokasi')
	}

	//toleransi longitude latitude
	/* new_latitude  = latitude  + (dy / r_earth) * (180 / pi);  0.00017966691
	new_longitude = longitude + (dx / r_earth) * (180 / pi) / cos(latitude * pi/180);  0.00017966691/cos(latitude * pi/180)
 */
	//semua di bawah sudah ada di call_plan.js, tdk ada perubahan
	/* photo(frm) {
		const capture = new frappe.ui.Capture({
			animate: false,
			error: true,
		});

		capture.show();

		capture.submit((dataurl) => {
			function url_to_file(url, filename, mimeType) {
				return fetch(url)
					.then(function (res) {
						return res.arrayBuffer();
					})
					.then(function (buf) {
						return new File([buf], filename, { type: mimeType });
					});
			}

			function onPositionRecieved(position) {
				var call_longitude = position.coords.longitude;
				var call_latitude = position.coords.latitude;
				frm.set_value("call_longitude", call_longitude);
				frm.set_value("call_latitude", call_latitude);

				let iframe = `<div class="mapouter"><div class="gmap_canvas"><iframe width=80% height="300" id="gmap_canvas" src="https://maps.google.com/maps?q=${call_latitude},${call_longitude}&t=&z=17&ie=UTF8&iwloc=&output=embed" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe></div>`;

				frm.set_df_property("locationcall", "options", iframe);

				frm.refresh_field("locationcall");
			}
		});
	},
 */
	/* get_call_location(frm) {
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition((position) => {
				console.log(position.coords.latitude, position.coords.longitude);
			});
		} else {
			console.log("geolocation unavailable");
		}
	}, */
});
