// Copyright (c) 2024, Nadine Verelia and contributors
// For license information, please see license.txt
frappe.ui.form.on("Call Realisasi", {
	refresh(frm) {
		console.log(navigator.mediaDevices);
		frm.trigger("get_call_location");
		if (frm.doc.tanggal_kunjungan) {
			frm.fields_dict.mulai_realisasi.toggle(false);
		}
	},

	call(frm) {
		frm.set_query("tanggal_target", (doc) => {
			return {
				filters: {
					parent: doc.call, // whatever branch is selected
				},
			};
		});
	},

	mulai_realisasi(frm) {
		frm.fields_dict.mulai_realisasi.toggle(false);
		let currentTime = new Date();
		frm.set_value("tanggal_kunjungan", currentTime);
	},
	//tambah 1 baris convert dari datetime computer ke format frappe pake string
	nama_merchantklinik(frm) {
		frm.trigger("set_map");
	},
	set_map(frm) {
		let html =
			//`<iframe src='https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1345.0290787498923!2d${frm.doc.merch_longitude}!3d${frm.doc.merch_latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sid!4v1717991438573!5m2!1sen!2sid' width='600' height='450' style='border:0;' allowfullscreen='' loading='lazy' referrerpolicy='no-referrer-when-downgrade'></iframe> `;
			`<iframe src='https://maps.google.com/maps?q=${frm.doc.merch_latitude},${frm.doc.merch_longitude}&t=&z=17&ie=UTF8&iwloc=&output=embed' width='80%' height="300" id="gmap_canvas"></iframe>`;
		frm.set_df_property("locationmerchant", "options", html);
	},
	photo(frm) {
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

	get_call_location(frm) {
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition((position) => {
				console.log(position.coords.latitude, position.coords.longitude);
			});
		} else {
			console.log("geolocation unavailable");
		}
	},
});
