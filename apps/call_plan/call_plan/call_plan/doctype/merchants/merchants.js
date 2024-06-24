// Copyright (c) 2024, Nadine Verelia and contributors
// For license information, please see license.txt

 frappe.ui.form.on("Merchants", {
 	//refresh(frm) {
 	//},
     branch(frm) {
        frm.set_query("area", (doc) => {
            return {
                filters: {
                    "parent_branch": doc.branch // whatever branch is selected
                }
            }
        });
    }
    
 });
