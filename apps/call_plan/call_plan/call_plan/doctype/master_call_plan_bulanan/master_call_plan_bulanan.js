// Copyright (c) 2024, Nadine Verelia and contributors
// For license information, please see license.txt
var maks_jumlah_kunjungan=4
var months=['January','February','March','April','May','June','July','August','September','October','November','December']
var month;
var year;
var date;
var child;

function cek_tanggal(frm,cdt,cdn,no_kunjungan,selected_month,selected_year,){
    let field_kunjungan='kunjungan_'+String(no_kunjungan)
    child=locals[cdt][cdn]
    let selected_month_number=String(months.indexOf(selected_month)+1).padStart(2,'0')
    console.log(child[field_kunjungan])
    console.log(`${selected_year}-${selected_month_number}-01`)
    console.log(`${selected_year}-${selected_month_number}-31`)
    console.log(child[field_kunjungan]<`${selected_year}-${selected_month_number}-01`||child[field_kunjungan]>`${selected_year}-${selected_month_number}-31`)
    if (child[field_kunjungan]<`${selected_year}-${selected_month_number}-01`||child[field_kunjungan]>`${selected_year}-${selected_month_number}-31`){
        frappe.msgprint(__(`You can only select dates in ${selected_month} ${selected_year} in kunjungan ${String(no_kunjungan)}`));
        frappe.model.set_value(cdt,cdn,field_kunjungan, undefined)
}
}

frappe.ui.form.on("Master Call Plan bulanan", {
// 	refresh(frm) {

// 	},
    setup(frm){
        var currentTime = new Date();
        date= currentTime.getDate();
        month=currentTime.getMonth();
        year=currentTime.getFullYear();
        frm.set_df_property('tahun','options',String(year)+'\n'+String(year+1))
    },
    tahun(frm){
        console.log(month)
        //console.log(date)
        let avail_months;
        if (frm.doc.tahun==year){
            if (date<26){  
                avail_months=months.slice(month+1)
            }
            else{
                avail_months=months.slice(month+2)
            }
        }
        else{
            if (month==11 && date>25){
                avail_months=months.slice(1)
            }
            else{
                avail_months=months
            }
        }
        let month_choice = ''
        avail_months.forEach((month) => {
            month_choice+=month+'\n'
        })
        frm.set_df_property('bulan','options',month_choice)
    }
 });

frappe.ui.form.on("Master Call Plan copy", {
    frekuensi(frm,cdt,cdn){
        child=locals[cdt][cdn]
        let frekuensi=child.frekuensi;
        for (let i = 0; i < maks_jumlah_kunjungan; i++){
            if (i+1>frekuensi){
                if(child['kunjungan_'+String(i+1)]){
                    frappe.model.set_value(cdt,cdn,'kunjungan_'+String(i+1), undefined)
                }
            }
        }
    },
    kunjungan_1(frm,cdt,cdn){
        cek_tanggal(frm,cdt,cdn,1,frm.doc.bulan,frm.doc.tahun)
    },
    kunjungan_2(frm,cdt,cdn){
        cek_tanggal(frm,cdt,cdn,2,frm.doc.bulan,frm.doc.tahun)
    },
    kunjungan_3(frm,cdt,cdn){
        cek_tanggal(frm,cdt,cdn,3,frm.doc.bulan,frm.doc.tahun)
    },
    kunjungan_4(frm,cdt,cdn){
        cek_tanggal(frm,cdt,cdn,4,frm.doc.bulan,frm.doc.tahun)
    },
});


