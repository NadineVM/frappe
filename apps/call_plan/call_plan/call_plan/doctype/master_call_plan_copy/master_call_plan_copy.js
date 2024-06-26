// Copyright (c) 2024, Nadine Verelia and contributors
// For license information, please see license.txt

 frappe.ui.form.on("Master Call Plan copy", {
 //	refresh(frm) {

 //	},
    frekuensi(frm){
        let frekuensi=frm.doc.frekuensi
        let maks_jumlah_kunjungan=4
        //frm.call('cek_validitas_tanggal',{frekuensi:frekuensi})
        for (let i = 0; i < maks_jumlah_kunjungan; i++){
            if (i+1>frekuensi){
                if(frm.doc['kunjungan_'+String(i+1)]){
                    frm.set_value('kunjungan_'+String(i+1),undefined)
                }
            }
        }
    },
 });
