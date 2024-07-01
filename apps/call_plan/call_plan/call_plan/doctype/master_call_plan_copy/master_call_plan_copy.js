// Copyright (c) 2024, Nadine Verelia and contributors
// For license information, please see license.txt
/* var maks_jumlah_kunjungan=4
 frappe.ui.form.on("Master Call Plan copy", {
 //	refresh(frm) {

 //	},
    frekuensi(frm){
        let frekuensi=frm.doc.frekuensi;
        for (let i = 0; i < maks_jumlah_kunjungan; i++){
            if (i+1>frekuensi){
                if(frm.doc['kunjungan_'+String(i+1)]){
                    frm.set_value('kunjungan_'+String(i+1),undefined)
                }
            }
        }
    },

    //validasi tanggal kunjungan

    validate(frm){
        let currentTime = new Date();
        function format(num, len = 2) {
			return `${num}`.padStart(len, '0');
		  }
        let date= format(currentTime.getDate());
        let month=format(currentTime.getMonth()+1);
        let year=format(currentTime.getFullYear());
        let today = `${year}-${month}-${date}`
        for (let i = 0; i < maks_jumlah_kunjungan; i++){
            if(i<frm.doc.frekuensi){
                //tidak bisa select past date
                if(frm.doc['kunjungan_'+String(i+1)]<today){
                    frappe.msgprint(__(`You can not select past date in kunjungan ${String(i+1)}`));
                    frappe.validated = false;
                }
                //tidak bisa select tanggal di luar bulan ini
                if (frm.doc['kunjungan_'+String(i+1)]<`${year}-${month}-01`||frm.doc['kunjungan_'+String(i+1)]>`${year}-${month}-31`){
                    let month_name = currentTime.toLocaleString('default', { month: 'long' })
                    frappe.msgprint(__(`You can only select dates in ${month_name} ${year} in kunjungan ${String(i+1)}`));
                    frappe.validated = false;
                }
        }
    }
 }
});
 */