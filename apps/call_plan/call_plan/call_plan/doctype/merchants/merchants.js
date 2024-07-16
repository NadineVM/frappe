// Copyright (c) 2024, Nadine Verelia and contributors
// For license information, please see license.txt

 frappe.ui.form.on("Merchants", {
 	refresh(frm) {
        frm.set_query("pic_pr", () => {
            return {
                filters: {
                    'is_group':0,
                }
            }
        });
        if (frm.doc.area){
            frm.trigger('area')
        }
 	},
    area(frm) {
        frm.set_query("branch", () => {
            return {
                filters: {
                    'is_group':0,
                    "parent_klasifikasi_wilayah_merchant": frm.doc.area // whatever area is selected
                }
            }
        });
        console.log(frm.doc.area)
    },
    
 });
