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
    frm.set_df_property('tahun','options',[String(year),String(year+1)])

}

function cek_duplicate_tanggal(frm,cdt,cdn,field_tanggal,field_tanggal_lain){
    child=locals[cdt][cdn]
    let tanggal=child[field_tanggal]
    field_tanggal_lain.forEach((field)=>{
        if (child[field]&&child[field]==tanggal){
            no_field=field.split('_')[1]
            frappe.msgprint(__(`Duplicate date in kunjungan ${no_field}`));
            frappe.model.set_value(cdt,cdn,field_tanggal, "")
        }
    })
}

//js jalan dulu sebelum python selesai & return value
function cek_tanggal(frm){
    var selected_month_number=String(months.indexOf(frm.doc.bulan)+1).padStart(2,'0')
    let list_error=[]
    frm.doc.call_plan.forEach((row)=>{
        let frekuensi=row.frekuensi
        for (let i = 0; i < frekuensi; i++){
            let field_kunjungan='kunjungan_'+String(i+1)
            if (row[field_kunjungan]<`${frm.doc.tahun}-${selected_month_number}-01`||row[field_kunjungan]>`${frm.doc.tahun}-${selected_month_number}-31`){
                //list_error.push(`kunjungan ${String(i+1)} of ${row.fetched_merchant_name}`)
                list_error.push(`${row.fetched_merchant_name}`)
                break
            }
        }        
    })
    if (list_error.length>0){
        console.log(`${list_error},length=${list_error.length} validasi false tertriger karena ini`)
        frappe.msgprint(__(`You can only select dates in ${frm.doc.bulan} ${frm.doc.tahun} in ${list_error.join(', ')}`));
        frappe.validated=false}
    
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

function set_route_realisasi(frm,cdt,cdn){
    child=locals[cdt][cdn]
    let realisasi_baru=`<button class="btn btn-primary" onclick="window.location.href='/app/call-realisasi/new?master_plan=${frm.docname}&nama_merchantklinik=${child.merchant_name}'">Mulai Realisasi</button>`
    frm.set_df_property('call_plan', "options", realisasi_baru, frm.docname, `start_realisasi`, child.name)
    for (let i = 0; i < child.frekuensi; i++){
        /* if (child[`status_${i+1}`]=='Belum realisasi'){
            frm.set_df_property('call_plan', "options", realisasi_baru, frm.docname, `realisasi_route_${i+1}`, child.name);} */
        if (child[`status_${i+1}`]!='Belum realisasi'){
            let tanggal_kunjungan=frappe.format(child[`kunjungan_${i+1}`],{ fieldtype: 'Date' })
            let realisasi_route=`<a href="/app/call-realisasi/CR-${child.merchant_name}(${tanggal_kunjungan})">Go to realisasi</a>`
            frm.set_df_property('call_plan', "options", realisasi_route, frm.docname, `realisasi_route_${i+1}`, child.name);}
    
    }
}

frappe.ui.form.on("Master Call Plan bulanan", {

//set informasi merchant yang sudah diplan sebelum save
    validate(frm){
        cek_unplanned_merchant(frm)
        //cek tanggal kunjungan untuk semua row
        cek_tanggal(frm)
    },

//set filter, cek unplanned merchant, dan set opsi tahun (jika belum diset) saat form di load
    refresh(frm){
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
        frm.set_df_property('bulan','options',avail_months)
    },

    //validasi panggil lg sblm save
    bulan(frm){
        //frm.save();
    }
 });

frappe.ui.form.on("Master Call Plan copy", {
    form_render(frm,cdt,cdn){
        //kalau form sudah approve, tampilkan tombol-tombol realisasi
        if (frm.doc.workflow_state=='Approved'){
            set_route_realisasi(frm,cdt,cdn)}
    },
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
        cek_duplicate_tanggal(frm,cdt,cdn,'kunjungan_1',['kunjungan_2','kunjungan_3','kunjungan_4'])
    },
    kunjungan_2(frm,cdt,cdn){
        cek_duplicate_tanggal(frm,cdt,cdn,'kunjungan_2',['kunjungan_1','kunjungan_3','kunjungan_4'])
    },
    kunjungan_3(frm,cdt,cdn){
        cek_duplicate_tanggal(frm,cdt,cdn,'kunjungan_3',['kunjungan_1','kunjungan_2','kunjungan_4'])
    },
    kunjungan_4(frm,cdt,cdn){
        cek_duplicate_tanggal(frm,cdt,cdn,'kunjungan_4',['kunjungan_1','kunjungan_2','kunjungan_3'])
    },
});


