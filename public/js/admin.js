/* Cham Xanh Admin - vanilla JS SPA. Goi API cung origin qua /api. */
(function () {
  "use strict";

  var API = "/api";
  var token = localStorage.getItem("cx_token") || null;
  var currentUser = null;

  // ---------- helpers ----------
  function $(sel) {
    return document.querySelector(sel);
  }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function toast(msg, ok) {
    var t = el("div", { class: "toast " + (ok === false ? "err" : "ok") }, esc(msg));
    $("#toasts").appendChild(t);
    setTimeout(function () {
      t.remove();
    }, 3200);
  }

  function api(method, path, body) {
    var opts = { method: method, headers: {} };
    if (token) opts.headers.Authorization = "Bearer " + token;
    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    return fetch(API + path, opts).then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (data) {
          if (!res.ok) {
            var msg = (data && data.error && data.error.message) || "Đã có lỗi xảy ra";
            throw new Error(msg);
          }
          return data;
        });
    });
  }

  // ---------- auth ----------
  function showApp() {
    $("#loginView").classList.add("hidden");
    $("#appView").classList.remove("hidden");
    var name = (currentUser && (currentUser.name || currentUser.email)) || "Admin";
    $("#whoName").textContent = name;
    $("#whoAvatar").textContent = name.charAt(0);
    $("#apiBaseInfo").textContent = window.location.origin + "/api";
    connectSocket();
    go("dashboard");
  }
  function showLogin() {
    $("#appView").classList.add("hidden");
    $("#loginView").classList.remove("hidden");
  }

  $("#loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = $("#loginBtn");
    btn.disabled = true;
    api("POST", "/auth/login", {
      email: $("#email").value.trim(),
      password: $("#password").value,
    })
      .then(function (data) {
        if (!data.user || data.user.role !== "admin") {
          throw new Error("Tài khoản này không có quyền quản trị");
        }
        token = data.token;
        currentUser = data.user;
        localStorage.setItem("cx_token", token);
        toast("Đăng nhập thành công");
        showApp();
      })
      .catch(function (err) {
        toast(err.message, false);
      })
      .finally(function () {
        btn.disabled = false;
      });
  });

  $("#logoutBtn").addEventListener("click", function () {
    token = null;
    currentUser = null;
    localStorage.removeItem("cx_token");
    showLogin();
  });

  // ---------- navigation ----------
  var TITLES = {
    dashboard: "Tổng quan",
    plants: "Phần trên · Cây trồng",
    health: "Phần giữa · Góc sống khỏe",
    articles: "Phần cuối · Bài viết",
    users: "Người dùng",
    settings: "Cài đặt",
  };
  function go(page) {
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-page") === page);
    });
    document.querySelectorAll(".page").forEach(function (p) {
      p.classList.toggle("active", p.id === "page-" + page);
    });
    $("#pageTitle").textContent = TITLES[page] || "";
    $("#sidebar").classList.remove("open");
    if (page === "dashboard") loadDashboard();
    if (page === "articles") loadArticles();
    if (page === "plants") loadPlants();
    if (page === "health") loadHealth();
    if (page === "users") loadUsers();
  }
  document.querySelectorAll(".nav a").forEach(function (a) {
    a.addEventListener("click", function () {
      go(a.getAttribute("data-page"));
    });
  });
  $("#menuBtn").addEventListener("click", function () {
    $("#sidebar").classList.toggle("open");
  });

  // ---------- dashboard ----------
  function statCard(cls, label, value) {
    return (
      '<div class="stat ' +
      cls +
      '"><div><div class="label">' +
      label +
      '</div><div class="value">' +
      value +
      "</div></div></div>"
    );
  }
  function loadDashboard() {
    api("GET", "/admin/stats")
      .then(function (s) {
        $("#statCards").innerHTML =
          statCard("green", "Người dùng", s.totalUsers) +
          statCard("blue", "Cây trồng", s.totalPlants) +
          statCard("yellow", "Bài viết", s.totalArticles || 0) +
          statCard("green", "Bài đăng tuần này", s.totalPostsThisWeek);
        var rows = (s.topViewedPlants || [])
          .map(function (p) {
            return (
              "<tr><td>" +
              esc(p.name) +
              '</td><td><span class="badge gray">' +
              esc(p.category) +
              '</span></td><td>' +
              (p.viewCount || 0) +
              " lượt xem</td></tr>"
            );
          })
          .join("");
        $("#topPlants").innerHTML = rows
          ? '<div style="overflow-x:auto"><table><thead><tr><th>Tên cây</th><th>Danh mục</th><th>Lượt xem</th></tr></thead><tbody>' +
            rows +
            "</tbody></table></div>"
          : '<div class="empty">Chưa có dữ liệu</div>';
      })
      .catch(function (err) {
        toast(err.message, false);
      });
  }

  // ---------- articles + settings ----------
  var SETTING_KEYS = [
    "exploreGreetingTitle",
    "exploreGreetingSubtitle",
    "healthSectionTitle",
    "healthSectionSubtitle",
    "exploreArticleTitle",
  ];

  function loadSettings() {
    api("GET", "/settings")
      .then(function (data) {
        SETTING_KEYS.forEach(function (key) {
          var input = $("#setting_" + key);
          if (input) input.value = (data && data[key]) || "";
        });
      })
      .catch(function () {
        // im lang - khong chan trang bai viet neu loi
      });
  }

  // Bam nut "Luu" canh 1 o setting.
  document.addEventListener("click", function (e) {
    var key = e.target && e.target.dataset && e.target.dataset.saveSetting;
    if (!key) return;
    var input = $("#setting_" + key);
    var value = input ? input.value.trim() : "";
    if (!value) {
      toast("Nội dung không được để trống", false);
      return;
    }
    e.target.disabled = true;
    api("PUT", "/settings/" + key, { value: value })
      .then(function () {
        toast("Đã cập nhật, app sẽ đồng bộ ngay");
      })
      .catch(function (err) {
        toast(err.message, false);
      })
      .finally(function () {
        e.target.disabled = false;
      });
  });

  function loadArticles() {
    loadSettings();
    api("GET", "/articles?all=true")
      .then(function (list) {
        if (!list.length) {
          $("#articleList").innerHTML = '<div class="empty">Chưa có bài viết nào. Bấm "+ Thêm bài viết".</div>';
          return;
        }
        $("#articleList").innerHTML = list
          .map(function (a) {
            var cover = a.coverImageUrl
              ? '<img class="cover" src="' + esc(a.coverImageUrl) + '" onerror="this.style.display=\'none\'" />'
              : '<div class="cover"></div>';
            var status = a.published
              ? '<span class="badge green">Đã đăng</span>'
              : '<span class="badge gray">Nháp</span>';
            return (
              '<div class="item-card">' +
              cover +
              '<div class="body"><h4>' +
              esc(a.title) +
              "</h4><div>" +
              status +
              '</div><p>' +
              esc(a.content) +
              '</p><div class="actions">' +
              '<button class="btn btn-light btn-sm" data-edit-article="' +
              a.id +
              '">Sửa</button>' +
              '<button class="btn btn-danger btn-sm" data-del-article="' +
              a.id +
              '">Xoá</button>' +
              "</div></div></div>"
            );
          })
          .join("");
        // cache for edit
        window.__articles = {};
        list.forEach(function (a) {
          window.__articles[a.id] = a;
        });
      })
      .catch(function (err) {
        toast(err.message, false);
      });
  }

  function articleModal(article) {
    var a = article || { title: "", content: "", coverImageUrl: "", tags: [], published: true };
    var isEdit = !!article;
    openModal(
      (isEdit ? "Sửa bài viết" : "Thêm bài viết mới"),
      '<div class="field"><label>Tiêu đề</label><input id="m_title" value="' +
        esc(a.title) +
        '" /></div>' +
        '<div class="field"><label>Ảnh bìa (URL)</label><input id="m_cover" placeholder="https://..." value="' +
        esc(a.coverImageUrl || "") +
        '" /></div>' +
        '<div class="field"><label>Nội dung</label><textarea id="m_content">' +
        esc(a.content) +
        "</textarea></div>" +
        '<div class="field"><label>Thẻ (cách nhau bởi dấu phẩy)</label><input id="m_tags" value="' +
        esc((a.tags || []).join(", ")) +
        '" /></div>' +
        '<div class="field"><label><input type="checkbox" id="m_pub" style="width:auto;margin-right:6px" ' +
        (a.published ? "checked" : "") +
        "/> Xuất bản (hiển thị trên app)</label></div>",
      function () {
        var body = {
          title: $("#m_title").value.trim(),
          coverImageUrl: $("#m_cover").value.trim(),
          content: $("#m_content").value.trim(),
          tags: $("#m_tags").value,
          published: $("#m_pub").checked,
        };
        if (!body.title || !body.content) {
          toast("Tiêu đề và nội dung không được để trống", false);
          return false;
        }
        var req = isEdit
          ? api("PUT", "/articles/" + article.id, body)
          : api("POST", "/articles", body);
        return req
          .then(function () {
            toast(isEdit ? "Đã cập nhật bài viết" : "Đã đăng bài viết");
            loadArticles();
            return true;
          })
          .catch(function (err) {
            toast(err.message, false);
            return false;
          });
      }
    );
  }

  $("#addArticleBtn").addEventListener("click", function () {
    articleModal(null);
  });

  // ---------- plants ----------
  var CATEGORIES = [];
  function loadCategories() {
    return api("GET", "/categories").then(function (c) {
      CATEGORIES = c || [];
    });
  }
  var HEALTH_CAT = "rau-cu-chua-benh";

  function plantCardHtml(p) {
    var img = p.imageUrl
      ? '<img class="cover" src="' + esc(p.imageUrl) + '" onerror="this.style.display=\'none\'" />'
      : '<div class="cover"></div>';
    return (
      '<div class="item-card">' +
      img +
      '<div class="body"><h4>' +
      esc(p.name) +
      '</h4><div><span class="badge blue">' +
      esc(p.category) +
      "</span></div><p>" +
      esc(p.description || "") +
      '</p><div class="actions">' +
      '<button class="btn btn-light btn-sm" data-edit-plant="' +
      p.id +
      '">Sửa</button>' +
      '<button class="btn btn-danger btn-sm" data-del-plant="' +
      p.id +
      '">Xoá</button>' +
      "</div></div></div>"
    );
  }

  function cachePlants(list) {
    window.__plants = window.__plants || {};
    list.forEach(function (p) {
      window.__plants[p.id] = p;
    });
  }

  // Phan tren: cay theo danh muc (khong gom "Goc song khoe").
  function loadPlants() {
    loadSettings();
    api("GET", "/plants")
      .then(function (list) {
        cachePlants(list);
        var top = list.filter(function (p) {
          return p.category !== HEALTH_CAT;
        });
        $("#plantList").innerHTML = top.length
          ? top.map(plantCardHtml).join("")
          : '<div class="empty">Chưa có cây nào. Bấm "+ Thêm cây".</div>';
      })
      .catch(function (err) {
        toast(err.message, false);
      });
  }

  // Phan giua: cay "Goc xanh song khoe" (danh muc rau-cu-chua-benh).
  function loadHealth() {
    loadSettings();
    api("GET", "/plants?category=" + HEALTH_CAT)
      .then(function (list) {
        cachePlants(list);
        $("#healthList").innerHTML = list.length
          ? list.map(plantCardHtml).join("")
          : '<div class="empty">Chưa có cây sống khỏe nào. Bấm "+ Thêm cây sống khỏe".</div>';
      })
      .catch(function (err) {
        toast(err.message, false);
      });
  }

  function reloadActivePlantList() {
    if ($("#page-health").classList.contains("active")) loadHealth();
    else loadPlants();
  }

  function plantModal(plant, presetCategory) {
    var p = plant || {
      name: "", category: presetCategory || "", description: "", imageUrl: "", careLevel: "easy", isMedicinal: !!presetCategory,
      light: "", water: "", harvestTime: "", soilType: "", seedPrice: "",
      healthBenefits: "", harvestTimeline: "", didYouKnow: "", forYou: "", careInstructions: [],
    };
    var isEdit = !!plant;
    var catOpts = CATEGORIES.map(function (c) {
      return '<option value="' + esc(c.value) + '"' + (p.category === c.value ? " selected" : "") + ">" + esc(c.label) + "</option>";
    }).join("");
    // careInstructions -> text "Tiêu đề | mô tả" moi dong 1 muc.
    var careText = (p.careInstructions || [])
      .map(function (it) {
        return (it.title || "") + " | " + (it.body || "");
      })
      .join("\n");
    openModal(
      isEdit ? "Sửa cây" : "Thêm cây mới",
      '<div class="field"><label>Tên cây</label><input id="p_name" value="' +
        esc(p.name) +
        '" /></div>' +
        '<div class="field"><label>Danh mục</label><select id="p_cat"><option value="">-- Chọn --</option>' +
        catOpts +
        "</select></div>" +
        '<div class="field"><label>Ảnh (URL)</label><input id="p_img" placeholder="https://..." value="' +
        esc(p.imageUrl || "") +
        '" /></div>' +
        '<div class="field"><label>Mô tả ngắn (dưới tên cây)</label><textarea id="p_desc">' +
        esc(p.description || "") +
        "</textarea></div>" +
        '<div class="field"><label>Độ chăm sóc</label><select id="p_care">' +
        ["easy", "medium", "hard"]
          .map(function (v) {
            var lbl = { easy: "Dễ chăm sóc", medium: "Chăm sóc vừa", hard: "Khó chăm sóc" }[v];
            return '<option value="' + v + '"' + (p.careLevel === v ? " selected" : "") + ">" + lbl + "</option>";
          })
          .join("") +
        "</select></div>" +
        '<h4 style="margin:14px 0 4px">4 ô thông tin nhanh</h4>' +
        '<div class="field"><label>Thu hoạch</label><input id="p_harvest" placeholder="80-100 ngày" value="' +
        esc(p.harvestTime || "") +
        '" /></div>' +
        '<div class="field"><label>Ánh sáng</label><input id="p_light" placeholder="Nắng toàn phần" value="' +
        esc(p.light || "") +
        '" /></div>' +
        '<div class="field"><label>Tưới nước</label><input id="p_water" placeholder="Đều đặn" value="' +
        esc(p.water || "") +
        '" /></div>' +
        '<div class="field"><label>Loại đất</label><input id="p_soil" placeholder="Giàu hữu cơ" value="' +
        esc(p.soilType || "") +
        '" /></div>' +
        '<h4 style="margin:14px 0 4px">Nội dung chi tiết</h4>' +
        '<div class="field"><label>Cách chăm sóc (mỗi dòng: <b>Tiêu đề | mô tả</b>)</label><textarea id="p_care_ins" rows="4" placeholder="Ánh sáng mặt trời | Cần 6-8 giờ nắng trực tiếp mỗi ngày.">' +
        esc(careText) +
        "</textarea></div>" +
        '<div class="field"><label>Lợi ích sức khỏe</label><textarea id="p_health">' +
        esc(p.healthBenefits || "") +
        "</textarea></div>" +
        '<div class="field"><label>Thời gian thu hoạch</label><textarea id="p_timeline">' +
        esc(p.harvestTimeline || "") +
        "</textarea></div>" +
        '<div class="field"><label>Bạn có biết?</label><textarea id="p_know">' +
        esc(p.didYouKnow || "") +
        "</textarea></div>" +
        '<div class="field"><label>Dành cho bạn</label><textarea id="p_foryou">' +
        esc(p.forYou || "") +
        "</textarea></div>" +
        '<div class="field"><label>Giá bán giống (VND)</label><input id="p_price" type="number" placeholder="45000" value="' +
        esc(p.seedPrice != null ? p.seedPrice : "") +
        '" /></div>' +
        '<div class="field"><label><input type="checkbox" id="p_med" style="width:auto;margin-right:6px" ' +
        (p.isMedicinal ? "checked" : "") +
        "/> Cây dược liệu / chữa bệnh</label></div>",
      function () {
        var body = {
          name: $("#p_name").value.trim(),
          category: $("#p_cat").value,
          imageUrl: $("#p_img").value.trim(),
          description: $("#p_desc").value.trim(),
          careLevel: $("#p_care").value,
          isMedicinal: $("#p_med").checked,
          light: $("#p_light").value.trim(),
          water: $("#p_water").value.trim(),
          harvestTime: $("#p_harvest").value.trim(),
          soilType: $("#p_soil").value.trim(),
          careInstructions: $("#p_care_ins").value,
          healthBenefits: $("#p_health").value.trim(),
          harvestTimeline: $("#p_timeline").value.trim(),
          didYouKnow: $("#p_know").value.trim(),
          forYou: $("#p_foryou").value.trim(),
          seedPrice: $("#p_price").value.trim(),
        };
        if (!body.name || !body.category) {
          toast("Tên và danh mục không được để trống", false);
          return false;
        }
        var req = isEdit ? api("PUT", "/plants/" + plant.id, body) : api("POST", "/plants", body);
        return req
          .then(function () {
            toast(isEdit ? "Đã cập nhật cây" : "Đã thêm cây");
            reloadActivePlantList();
            return true;
          })
          .catch(function (err) {
            toast(err.message, false);
            return false;
          });
      }
    );
  }

  $("#addPlantBtn").addEventListener("click", function () {
    plantModal(null);
  });
  var addHealthBtn = $("#addHealthBtn");
  if (addHealthBtn) {
    addHealthBtn.addEventListener("click", function () {
      plantModal(null, HEALTH_CAT);
    });
  }

  // ---------- users ----------
  function loadUsers() {
    api("GET", "/admin/users")
      .then(function (list) {
        $("#userTable").innerHTML = list
          .map(function (u) {
            var role =
              u.role === "admin"
                ? '<span class="badge green">admin</span>'
                : '<span class="badge gray">user</span>';
            var status = u.isLocked
              ? '<span class="badge red">Đã khoá</span>'
              : '<span class="badge blue">Hoạt động</span>';
            var lockBtn =
              '<button class="btn btn-light btn-sm" data-lock-user="' +
              u.id +
              '" data-locked="' +
              (u.isLocked ? "1" : "0") +
              '">' +
              (u.isLocked ? "Mở khoá" : "Khoá") +
              "</button>";
            var delBtn =
              '<button class="btn btn-danger btn-sm" data-del-user="' + u.id + '">Xoá</button>';
            return (
              "<tr><td>" +
              esc(u.name) +
              "</td><td>" +
              esc(u.email) +
              "</td><td>" +
              role +
              "</td><td>" +
              status +
              '</td><td><div class="row-actions">' +
              lockBtn +
              delBtn +
              "</div></td></tr>"
            );
          })
          .join("");
      })
      .catch(function (err) {
        toast(err.message, false);
      });
  }

  // ---------- delegated clicks (edit/delete) ----------
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t.dataset.editArticle) articleModal(window.__articles[t.dataset.editArticle]);
    if (t.dataset.delArticle) confirmDel("Xoá bài viết này?", "/articles/" + t.dataset.delArticle, loadArticles);
    if (t.dataset.editPlant) plantModal(window.__plants[t.dataset.editPlant]);
    if (t.dataset.delPlant) confirmDel("Xoá cây này?", "/plants/" + t.dataset.delPlant, reloadActivePlantList);
    if (t.dataset.delUser) confirmDel("Xoá người dùng này?", "/admin/users/" + t.dataset.delUser, loadUsers);
    if (t.dataset.lockUser) {
      var locked = t.dataset.locked === "1";
      api("PUT", "/admin/users/" + t.dataset.lockUser, { isLocked: !locked })
        .then(function () {
          toast(locked ? "Đã mở khoá" : "Đã khoá tài khoản");
          loadUsers();
        })
        .catch(function (err) {
          toast(err.message, false);
        });
    }
  });

  function confirmDel(msg, path, reload) {
    if (!window.confirm(msg)) return;
    api("DELETE", path)
      .then(function () {
        toast("Đã xoá");
        reload();
      })
      .catch(function (err) {
        toast(err.message, false);
      });
  }

  // ---------- modal ----------
  function openModal(title, bodyHtml, onSave) {
    var root = $("#modalRoot");
    root.innerHTML =
      '<div class="modal-backdrop"><div class="modal"><h3>' +
      esc(title) +
      "</h3><div id='modalBody'>" +
      bodyHtml +
      '</div><div class="modal-foot"><button class="btn btn-light" id="mCancel">Huỷ</button><button class="btn btn-primary" id="mSave">Lưu</button></div></div></div>';
    $("#mCancel").addEventListener("click", closeModal);
    root.querySelector(".modal-backdrop").addEventListener("click", function (ev) {
      if (ev.target.classList.contains("modal-backdrop")) closeModal();
    });
    $("#mSave").addEventListener("click", function () {
      var r = onSave();
      if (r && typeof r.then === "function") {
        $("#mSave").disabled = true;
        r.then(function (ok) {
          if (ok) closeModal();
          else $("#mSave").disabled = false;
        });
      } else if (r !== false) {
        closeModal();
      }
    });
  }
  function closeModal() {
    $("#modalRoot").innerHTML = "";
  }

  // ---------- socket realtime (admin auto-refresh) ----------
  function connectSocket() {
    if (typeof io === "undefined") return;
    var socket = io("/", { auth: { token: token } });
    var refreshArticles = function () {
      if ($("#page-articles").classList.contains("active")) loadArticles();
    };
    var refreshPlants = function () {
      if ($("#page-plants").classList.contains("active")) loadPlants();
    };
    socket.on("article:created", refreshArticles);
    socket.on("article:updated", refreshArticles);
    socket.on("article:deleted", refreshArticles);
    socket.on("plant:created", refreshPlants);
    socket.on("plant:updated", refreshPlants);
    socket.on("plant:deleted", refreshPlants);
    socket.on("settings:updated", function (payload) {
      if (payload && SETTING_KEYS.indexOf(payload.key) >= 0) {
        var input = $("#setting_" + payload.key);
        if (input) input.value = payload.value || "";
      }
    });
    socket.on("plant:created", function () {
      if ($("#page-health").classList.contains("active")) loadHealth();
    });
    socket.on("plant:updated", function () {
      if ($("#page-health").classList.contains("active")) loadHealth();
    });
    socket.on("plant:deleted", function () {
      if ($("#page-health").classList.contains("active")) loadHealth();
    });
  }

  // ---------- boot ----------
  loadCategories().finally(function () {
    if (token) {
      api("GET", "/auth/me")
        .then(function (u) {
          if (u.role !== "admin") throw new Error("not admin");
          currentUser = u;
          showApp();
        })
        .catch(function () {
          token = null;
          localStorage.removeItem("cx_token");
          showLogin();
        });
    } else {
      showLogin();
    }
  });
})();
