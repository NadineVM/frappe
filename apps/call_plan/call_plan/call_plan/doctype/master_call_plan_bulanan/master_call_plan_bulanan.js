// Copyright (c) 2024, Nadine Verelia and contributors
// For license information, please see license.txt
var maks_jumlah_kunjungan=4
var months=['January','February','March','April','May','June','July','August','September','October','November','December']
var month;
var year;
var date;
var child;
var planned_merchant;

function set_opsi_tahun(frm){
    var currentTime = new Date();
    date= currentTime.getDate();
    month=currentTime.getMonth();
    year=currentTime.getFullYear();
    frm.set_df_property('tahun','options',String(year)+'\n'+String(year+1))

}

function cek_tanggal(frm,cdt,cdn,no_kunjungan,selected_month,selected_year,){
    let field_kunjungan='kunjungan_'+String(no_kunjungan)
    child=locals[cdt][cdn]
    //dapatkan index bulan
    let selected_month_number=String(months.indexOf(selected_month)+1).padStart(2,'0')
    //gagalkan set tanggal jika tanggal yang dipilih di luar bulan yang dipilih
    if (child[field_kunjungan]<`${selected_year}-${selected_month_number}-01`||child[field_kunjungan]>`${selected_year}-${selected_month_number}-31`){
        frappe.msgprint(__(`You can only select dates in ${selected_month} ${selected_year} in kunjungan ${String(no_kunjungan)}`));
        frappe.model.set_value(cdt,cdn,field_kunjungan, undefined)
}
}

function set_filter_merchant(frm){
    planned_merchant=[]
    //non avail merchant adalah semua merchant yang sudah diselect kecuali merchant di doctype yang sedang diedit
    frm.doc.call_plan.forEach((row)=>{
        if (row.merchant_name){
            planned_merchant.push(row.merchant_name)
        }
    })
    frm.set_query('merchant_name','call_plan',()=>{
        return{
            'filters':{
                'merchant_code':['not in',planned_merchant]
            }
        }
    })

}

function cek_unplanned_merchant(frm){
    //dapatkan merchant yang belum diplan
    frm.call('get_merchant_list',{planned_merchant:planned_merchant}).then((unplanned_merchant)=>{
        //jika semua merchant sudah diplan
        if(unplanned_merchant.message.length>0){
            frm.set_value('kelengkapan','Belum lengkap')
            frm.set_df_property('keterangan','options',
                `<p>${unplanned_merchant.message.length} unplanned merchants: ${unplanned_merchant.message.join(', ')}<p>`)
        }
        //jika ada merchant yang belum diplan
        else{
            frm.set_value('kelengkapan','Lengkap')
            frm.set_df_property('keterangan','options','All merchants are planned')
        }
    })

}

frappe.ui.form.on("Master Call Plan bulanan", {

//set opsi tahun ketika dokumen pertama dibuat
setup(frm){
    set_opsi_tahun(frm)
},

//set informasi merchant yang sudah diplan sebelum save
    validate(frm){
        cek_unplanned_merchant(frm)
    },

//set filter, cek unplanned merchant, dan set opsi tahun (jika belum diset) saat form di load
    onload(frm){
        set_filter_merchant(frm)
        cek_unplanned_merchant(frm)
        if (!frm.doc.tahun){
            set_opsi_tahun(frm)
        }
    },

//set opsi bulan ketika tahun dipilih
    tahun(frm){
        console.log(month)
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
    },
    bulan(frm){
        frm.save();
    }
 });

frappe.ui.form.on("Master Call Plan copy", {
    merchant_name(frm,cdt,cdn){
        set_filter_merchant(frm)
        cek_unplanned_merchant(frm)
    },
    call_plan_remove(frm,cdt,cdn){ 
        set_filter_merchant(frm)
        cek_unplanned_merchant(frm)
    },
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


