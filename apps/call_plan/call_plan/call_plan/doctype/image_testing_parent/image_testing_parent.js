// Copyright (c) 2024, Nadine Verelia and contributors
// For license information, please see license.txt

frappe.ui.form.on("image testing parent", {
    refresh(frm) {
		frm.trigger("showpic");
	},
	insert_picture(frm) {
		frm.trigger("showpic");
	},
	showpic(frm) {
		frm.doc.child_doc.set_df_property("tampilan_foto_2", "options", `<img src=${frm.doc.insert_picture} >`);
	},
 });
