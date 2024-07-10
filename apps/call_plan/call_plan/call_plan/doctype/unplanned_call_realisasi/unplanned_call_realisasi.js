// Copyright (c) 2024, Nadine Verelia and contributors
// For license information, please see license.txt
var toleransi_dalam_meter=50
frappe.ui.form.on("Unplanned Call Realisasi", {
    refresh(frm) {
        frm.trigger('set_map')
		if (frm.doc.tanggal_kunjungan) {
			frm.fields_dict.mulai_realisasi.toggle(false);
			}
 	},
    nama_merchantklinik(frm){
		frm.trigger('set_map')
        //reset tanggal kunjungan sebenarnya jika ada perubahan merchant
        if(frm.doc.tanggal_kunjungan){
		    frm.fields_dict.mulai_realisasi.toggle(true);
		    frm.set_value('tanggal_kunjungan','')}
        if(frm.doc.kesesuaian_lokasi){
            frm.set_value('kesesuaian_lokasi','')}
	},
    //set map lokasi merchant
    set_map(frm) {
		if(frm.doc.jenis_kunjungan=='Offline'&&frm.doc.nama_merchantklinik){
			let html =
				//`<iframe src='https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1345.0290787498923!2d${frm.doc.merch_longitude}!3d${frm.doc.merch_latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sid!4v1717991438573!5m2!1sen!2sid' width='600' height='450' style='border:0;' allowfullscreen='' loading='lazy' referrerpolicy='no-referrer-when-downgrade'></iframe> `;
				`<iframe src='https://maps.google.com/maps?q=${frm.doc.merch_latitude},${frm.doc.merch_longitude}&t=&z=17&ie=UTF8&iwloc=&output=embed' width='80%' height="300" id="gmap_canvas"></iframe>`;
			frm.set_df_property("locationmerchant", "options", html);}
	},

    mulai_realisasi(frm) {
		function format(num, len = 2) {
			return `${num}`.padStart(len, '0');
		  }
		let currentTime = new Date();
		let hours=format(currentTime.getHours())
        let minutes=format(currentTime.getMinutes())
		let seconds=format(currentTime.getSeconds())
        let month=format(currentTime.getMonth()+1)
		let date=format(currentTime.getDate())
        let year=format(currentTime.getFullYear())
			frm.fields_dict.mulai_realisasi.toggle(false);
			frm.set_value("tanggal_kunjungan", `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`)
	},
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
    photo(frm){
		//delete saat transfer//
		frm.set_value('call_longitude','106.7126565')
		frm.set_value('call_latitude','-6.2725422')
		//delete saat transfer//
		frm.trigger('cek_lokasi')
	}
 });
