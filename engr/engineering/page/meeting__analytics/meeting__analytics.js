frappe.pages["meeting--analytics"].on_page_load = function (wrapper) {
    frappe.ui.make_app_page({
        parent: wrapper,
        title: __("Meeting Analytics"),
        single_column: true,
    });

    // Update this if your app/module path differs.
    const methodRoot = "engr.engineering.page.meeting__analytics.meeting__analytics.";

    const escapeHTML = (str) => {
        if (str === null || str === undefined) return "";
        return String(str).replace(/[&<>'"]/g, (m) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
        }[m]));
    };

    const state = {
        filters: { period_preset: "this_month", from_date: null, to_date: null, user: null, territory: null },
        data: null,
        trends: { actual: [] },
        loading: false,
        users: [],
        theme: localStorage.getItem("mta-theme") || "light",
        view: localStorage.getItem("mta-view") || "overview",
        search: "",
        periodGroupBy: "",
        _selectedGrade: null,
        _expandedEmployee: null, // Track which employee's category view is expanded
    };

    const PALETTE = {
        purple: { bg: "var(--mta-tint-purple)", fg: "#8B5CF6" },
        blue:   { bg: "var(--mta-tint-blue)",   fg: "#4F46E5" },
        green:  { bg: "var(--mta-tint-green)",  fg: "#10B981" },
        orange: { bg: "var(--mta-tint-orange)", fg: "#F97316" },
        teal:   { bg: "var(--mta-tint-teal)",   fg: "#14B8A6" },
        amber:  { bg: "var(--mta-tint-amber)",  fg: "#F59E0B" },
        red:    { bg: "var(--mta-tint-red)",    fg: "#EF4444" },
    };

    const CHART_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#EC4899"];

    const TABS = [
        { id: "overview",  label: "Overview",  icon: "grid" },
        { id: "team",      label: "Team",      icon: "users" },
        { id: "territory", label: "Territory", icon: "map" },
        { id: "activity",  label: "Activity",  icon: "calendar" },
    ];

    const CARD_ORDER = ["scheduled_meetings", "actual_meetings", "achievement_pct", "new_customers", "avg_per_day"];

    // Cards that route somewhere when clicked. achievement_pct / avg_per_day are
    // computed metrics with no single backing list, so they're left out (non-clickable).
    const CARD_ROUTES = {
        scheduled_meetings: buildMeetingScheduleUrl,
        actual_meetings: buildMeetingListUrl,
        new_customers: buildCustomerListUrl,
    };

    const $page = $(wrapper).find(".page-content");
    injectStyles();
    $page.addClass("mta-page").attr("data-theme", state.theme).html(getLayout());

    // ── Frappe date controls (replaces native HTML date inputs) ──
    state.dateControls = {
        from: frappe.ui.form.make_control({
            parent: $page.find("#mta-from-date"),
            df: { fieldtype: "Date", fieldname: "from_date", placeholder: __("From Date") },
            render_input: true,
        }),
        to: frappe.ui.form.make_control({
            parent: $page.find("#mta-to-date"),
            df: { fieldtype: "Date", fieldname: "to_date", placeholder: __("To Date") },
            render_input: true,
        }),
    };

    bindEvents();
    restoreFiltersFromURL();
    applyView(state.view);
    loadUsers().then(loadPageData);

    // ============================================================
    // LAYOUT
    // ============================================================
    function getLayout() {
        return `
<div class="mta-shell">

    <div class="mta-filter-bar" style="margin-top:16px;">
        <div class="mta-filter-group" style="width:100%; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            <div class="mta-field mta-field-icon">
                ${iconSvg("calendar")}
                <select id="mta-preset">
                    <option value="today">Today</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month" selected>This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="this_quarter">This Quarter</option>
                    <option value="this_year">This Year</option>
                    <option value="custom">Custom Range</option>
                </select>
            </div>
            <div class="mta-field mta-date-field" style="display:none;">
                <div id="mta-from-date" class="mta-date-control"></div>
            </div>
            <div class="mta-field mta-date-field" style="display:none;">
                <div id="mta-to-date" class="mta-date-control"></div>
            </div>
            <div class="mta-field mta-field-icon">
                ${iconSvg("users")}
                <select id="mta-user"><option value="">All Employees</option></select>
            </div>
            <div class="mta-field mta-field-icon">
                ${iconSvg("map")}
                <select id="mta-territory"><option value="">All Territories</option></select>
            </div>
            <button class="mta-btn-apply" id="mta-apply">Apply</button>

            <div class="mta-filter-right" style="margin-left:auto; display:flex; align-items:center; gap:12px;">
                <div class="mta-range-summary" id="mta-range-summary"></div>
                <div class="mta-search">
                    ${iconSvg("search")}
                    <input id="mta-search" placeholder="Search...">
                </div>
                <button class="mta-icon-btn" id="mta-export" title="Export Dashboard" style="width:auto; padding:0 12px; gap:6px;">
                    ${iconSvg("download")} <span style="font-size:13px; font-weight:600;">Export</span>
                </button>
                <button class="mta-icon-btn" id="mta-refresh" title="Refresh">${iconSvg("refresh")}</button>
                <button class="mta-icon-btn" id="mta-theme" title="Toggle Theme">${iconSvg("theme")}</button>
            </div>
        </div>

        <div class="mta-tabs-wrapper">
            <div class="mta-tabs" id="mta-tabs">
                ${TABS.map((t) => `
                    <button class="mta-tab ${t.id === state.view ? "is-active" : ""}" data-view="${t.id}">
                        ${iconSvg(t.icon)}<span>${t.label}</span>
                    </button>`).join("")}
            </div>
            <div class="mta-brand-dot-wrap" id="mta-status" title="Loading state">
                <span class="mta-brand-dot"></span><span class="mta-brand-meta">Live</span>
            </div>
        </div>
    </div>

    <div id="mta-insights"></div>
    <div class="mta-kpi-grid" id="mta-kpis">${shimmer(5, "mta-kpi-skeleton")}</div>

    <!-- Overview -->
    <div class="mta-section" data-view="overview">
        ${sectionTitle("Meeting Trend", "Actual vs Scheduled over the selected period")}
        <div class="mta-bento">
            <div class="mta-bento-span-12">${chartPanel("meeting_trend", "Meeting Trend", "Daily count of Actual (held) vs Scheduled meetings.")}</div>
        </div>

        ${sectionTitle("Grade & Territory Breakdown", "Where meetings are concentrated")}
        <div class="mta-bento">
            <div class="mta-bento-span-6">
                <div class="mta-panel" data-chart-panel="grade_donut">
                    <div class="mta-panel-head">
                        <div><h3>Meetings by Customer Grade</h3><span class="mta-subtitle">Click a grade to drill down</span></div>
                        <div class="mta-panel-actions">
                            <button class="mta-icon-btn mta-mini" data-csv="grade_donut" title="Export CSV">${iconSvg("download")}</button>
                        </div>
                    </div>
                    <div class="mta-panel-body mta-p-0" id="mta-grade-donut">${shimmerBlock()}</div>
                    <div id="mta-grade-drill"></div>
                </div>
            </div>
            <div class="mta-bento-span-6">
                <div class="mta-panel" data-chart-panel="territory_achievement">
                    <div class="mta-panel-head">
                        <div><h3>Achievement by Territory</h3><span class="mta-subtitle">Top 10, bar width relative to leader</span></div>
                        <div class="mta-panel-actions">
                            <button class="mta-icon-btn mta-mini" data-csv="territory_achievement" title="Export CSV">${iconSvg("download")}</button>
                        </div>
                    </div>
                    <div class="mta-panel-body" id="mta-territory-bars">${shimmerBlock()}</div>
                </div>
            </div>
        </div>

        ${sectionTitle("Team Performance Summary", "Top 5 by actual meetings — full table in the Team tab")}
        <div class="mta-bento">
            <div class="mta-bento-span-12">
                <div class="mta-panel">
                    <div class="mta-panel-body mta-p-0" id="mta-team-inline">${shimmerBlock()}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Team -->
    <div class="mta-section" data-view="team">
        ${sectionTitle("Team Performance", "Meeting Target (scaled by period), Scheduled, Actual, Achievement % and Customers per employee")}
        <div class="mta-bento">
            <div class="mta-bento-span-12">
                <div class="mta-panel">
                    <div class="mta-panel-head">
                        <div><h3>Team Performance</h3><span class="mta-subtitle" id="mta-team-period"></span></div>
                        <div class="mta-panel-actions">
                            <button class="mta-icon-btn mta-mini" data-csv="meeting_trend" title="Export trend CSV">${iconSvg("download")}</button>
                        </div>
                    </div>
                    <div class="mta-panel-body mta-p-0" id="mta-team-full">${shimmerBlock()}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Territory -->
    <div class="mta-section" data-view="territory">
        ${sectionTitle("Territory Performance", "Actual, Scheduled and Achievement % by territory")}
        <div class="mta-bento">
            <div class="mta-bento-span-6">
                <div class="mta-panel">
                    <div class="mta-panel-head">
                        <div><h3>Achievement % by Territory</h3></div>
                        <div class="mta-panel-actions">
                            <button class="mta-icon-btn mta-mini" data-csv="territory_achievement" title="Export CSV">${iconSvg("download")}</button>
                        </div>
                    </div>
                    <div class="mta-panel-body" id="mta-territory-bars-full">${shimmerBlock()}</div>
                </div>
            </div>
            <div class="mta-bento-span-6">
                <div class="mta-panel">
                    <div class="mta-panel-head"><div><h3>Territory Table</h3></div></div>
                    <div class="mta-panel-body mta-p-0" id="mta-territory-table">${shimmerBlock()}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Activity -->
    <div class="mta-section" data-view="activity">
        ${sectionTitle("Daily Activity", "Today — held meetings and unmatched scheduled meetings")}
        <div class="mta-bento">
            <div class="mta-bento-span-12">
                <div class="mta-panel">
                    <div class="mta-panel-head"><div><h3>Daily Activity</h3><span class="mta-subtitle" id="mta-daily-activity-period"></span></div></div>
                    <div class="mta-panel-body mta-p-0" id="mta-daily-activity">${shimmerBlock()}</div>
                </div>
            </div>
        </div>

        <div class="mta-section-title mta-section-title-action">
            <div><span>Period Meetings  </span>  <em> — All held meetings in the selected period</em></div>
            <div class="mta-field mta-field-icon">
                ${iconSvg("grid")}
                <select id="mta-period-groupby">
                    <option value="">No Grouping</option>
                    <option value="customer">Group By Customer</option>
                    <option value="grade">Group By Grade</option>
                    <option value="employee">Group By Employee</option>
                </select>
            </div>
        </div>
        <div class="mta-bento">
            <div class="mta-bento-span-12">
                <div class="mta-panel">
                    <div class="mta-panel-body mta-p-0" id="mta-period-meetings">${shimmerBlock()}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Export modal -->
    <div class="mta-modal" id="mta-export-modal" style="display:none;">
        <div class="mta-modal-bg"></div>
        <div class="mta-modal-card" style="width:min(420px,92vw);">
            <div class="mta-modal-head"><h3>Export Dashboard</h3><span class="mta-icon-btn mta-mini" id="mta-export-close">${iconSvg("close")}</span></div>
            <div class="mta-modal-body" style="display:flex; flex-direction:column; gap:16px;">
                <div>
                    <label style="font-size:12px; font-weight:700; color:var(--mta-text-2); margin-bottom:8px; display:block;">This opens your browser's print dialog</label>
                    <p style="font-size:12.5px; color:var(--mta-text-3); line-height:1.5;">
                        Choose "Save as PDF" as the destination to get a landscape A4 report of the current tab.
                        Individual chart/table data can also be exported as CSV using the download icon on each panel.
                    </p>
                </div>
                <button class="mta-btn-apply" id="mta-run-export" style="width:100%; height:44px;">Print / Save as PDF</button>
            </div>
        </div>
    </div>

    <!-- Chart expand modal -->
    <div class="mta-modal" id="mta-chart-modal" style="display:none;">
        <div class="mta-modal-bg"></div>
        <div class="mta-modal-card">
            <div class="mta-modal-head"><h3 id="mta-chart-modal-title"></h3><span class="mta-icon-btn mta-mini" id="mta-chart-modal-close">${iconSvg("close")}</span></div>
            <div class="mta-modal-body" id="mta-chart-modal-body" style="min-height:360px;"></div>
        </div>
    </div>

    <!-- Employee Category Drill-down Modal -->
    <div class="mta-modal" id="mta-emp-category-modal" style="display:none;">
        <div class="mta-modal-bg"></div>
        <div class="mta-modal-card" style="width:min(800px,94vw); max-height:85vh; display:flex; flex-direction:column;">
            <div class="mta-modal-head">
                <div>
                    <h3 id="mta-emp-category-title">Meetings by Category</h3>
                    <span class="mta-subtitle" id="mta-emp-category-subtitle"></span>
                </div>
                <span class="mta-icon-btn mta-mini" id="mta-emp-category-close">${iconSvg("close")}</span>
            </div>
            <div class="mta-modal-body" id="mta-emp-category-body" style="overflow-y:auto; flex:1;">
                <div class="mta-shimmer" style="height:200px; border-radius:10px;"></div>
            </div>
        </div>
    </div>

</div>`;
    }

    function sectionTitle(text, sub) {
        return `<div class="mta-section-title"><span>${text}</span>${sub ? `<em>${sub}</em>` : ""}</div>`;
    }

    function chartPanel(id, title, infoText) {
        return `
        <div class="mta-panel" data-chart-panel="${id}">
            <div class="mta-panel-head">
                <div style="display:flex; align-items:center; gap:6px;">
                    <h3>${title}</h3>
                    ${infoText ? `<span class="mta-custom-tooltip" data-tooltip="${escapeHTML(infoText)}">${iconSvg("info")}</span>` : ""}
                </div>
                <div class="mta-panel-actions">
                    <button class="mta-icon-btn mta-mini" data-csv="${id}" title="Export CSV">${iconSvg("download")}</button>
                    <button class="mta-icon-btn mta-mini" data-expand="${id}" title="Expand">${iconSvg("expand")}</button>
                </div>
            </div>
            <div class="mta-chart-wrap" id="mta-chart-${id}">${shimmerBlock()}</div>
        </div>`;
    }

    function shimmer(count, cls) {
        return Array(count).fill(`<div class="${cls}"><div class="mta-shimmer"></div></div>`).join("");
    }
    function shimmerBlock() {
        return '<div class="mta-shimmer" style="height:100%; min-height:180px; border-radius:10px;"></div>';
    }
    function emptyState(msg) {
        return `<div class="mta-empty-state"><p>${msg || "No data for this selection"}</p></div>`;
    }

    // ============================================================
    // EVENTS
    // ============================================================
    function bindEvents() {
        $page.on("click", ".mta-tab", function () {
            const v = $(this).data("view");
            state.view = v;
            localStorage.setItem("mta-view", v);
            $page.find(".mta-tab").removeClass("is-active");
            $(this).addClass("is-active");
            applyView(v);
        });

        $page.on("change", "#mta-preset", function () {
            const v = $(this).val();
            $page.find(".mta-date-field").toggle(v === "custom");
        });

        $page.on("click", "#mta-apply", function () {
            state.filters.period_preset = $("#mta-preset").val();
            state.filters.from_date = state.dateControls.from.get_value() || null;
            state.filters.to_date = state.dateControls.to.get_value() || null;
            state.filters.user = $("#mta-user").val() || null;
            state.filters.territory = $("#mta-territory").val() || null;
            saveFiltersToURL();
            loadPageData();
        });

        $page.on("click", "#mta-export", () => $("#mta-export-modal").css("display", "flex"));
        $page.on("click", "#mta-export-close", () => $("#mta-export-modal").hide());
        $page.on("click", "#mta-run-export", runExport);
        $page.on("click", "#mta-refresh", () => loadPageData(true));
        $page.on("click", "#mta-theme", toggleTheme);

        $page.on("click", "[data-csv]", (e) => { e.stopPropagation(); downloadChartCsv($(e.currentTarget).data("csv")); });
        $page.on("click", "#mta-period-view-all", () => {
            window.open(buildMeetingListUrl(), "_blank");
        });
        $page.on("click", "[data-expand]", (e) => { e.stopPropagation(); openChartModal($(e.currentTarget).data("expand")); });
        $page.on("click", "#mta-chart-modal-close, #mta-chart-modal .mta-modal-bg", () => $("#mta-chart-modal").hide());
        $page.on("click", "#mta-export-modal .mta-modal-bg", () => $("#mta-export-modal").hide());

        // Employee category drill-down modal close
        $page.on("click", "#mta-emp-category-close, #mta-emp-category-modal .mta-modal-bg", () => {
            $("#mta-emp-category-modal").hide();
        });

        // + button click for employee category drill-down
        $page.on("click", ".mta-emp-expand-btn", function (e) {
            e.stopPropagation();
            const email = $(this).data("email");
            const name = $(this).data("name");
            openEmployeeCategoryModal(email, name);
        });

        // Period Meetings group-by selector
        $page.on("change", "#mta-period-groupby", function () {
            state.periodGroupBy = $(this).val();
            renderPeriodMeetings();
        });

        $page.on("input", "#mta-search", function () { state.search = $(this).val().toLowerCase(); applySearch(); });

        $page.on("mouseenter", ".mta-custom-tooltip", function (e) {
            const text = $(this).data("tooltip");
            const $t = $('<div class="mta-body-tooltip"></div>').text(text).appendTo("body");
            const rect = e.currentTarget.getBoundingClientRect();
            $t.css({ left: rect.left + rect.width / 2 - $t.outerWidth() / 2, top: rect.top - $t.outerHeight() - 8 }).addClass("is-visible");
            $(this).data("tooltipEl", $t);
        }).on("mouseleave", ".mta-custom-tooltip", function () {
            $(this).data("tooltipEl")?.remove();
        });

        // Open a Meeting form in a new tab
        $page.on("click", ".mta-open-meeting-btn", function (e) {
            e.stopPropagation();
            const name = $(this).data("meeting");
            if (name) window.open(`/app/meeting/${encodeURIComponent(name)}`, "_blank");
        });

        // Open a Meeting Schedule form in a new tab
        $page.on("click", ".mta-open-schedule-btn", function (e) {
            e.stopPropagation();
            const name = $(this).data("schedule");
            if (name) window.open(`/app/meeting-schedule/${encodeURIComponent(name)}`, "_blank");
        });

        // Clickable KPI cards → open the relevant filtered list view in a new tab
        $page.on("click", ".mta-kpi-clickable", function (e) {
            if ($(e.target).closest(".mta-kpi-info").length) return; // ignore clicks on the (i) tooltip icon
            const key = $(this).data("kpi");
            const builder = CARD_ROUTES[key];
            if (builder) window.open(builder(), "_blank");
        });

        // Toggle accordion for category groups in modal / grouped tables
        $page.on("click", ".mta-category-header", function () {
            const $header = $(this);
            const $content = $header.next(".mta-category-content");
            const isOpen = $header.hasClass("is-open");

            // Close all others within the same accordion container
            const $container = $header.closest(".mta-emp-category-accordion");
            $container.find(".mta-category-header").removeClass("is-open");
            $container.find(".mta-category-content").slideUp(200);

            if (!isOpen) {
                $header.addClass("is-open");
                $content.slideDown(200);
            }
        });
    }

    function applyView(v) {
        $page.find(".mta-section").each(function () { $(this).toggle($(this).data("view") === v); });
    }

    function applySearch() {
        const q = state.search;
        $page.find("tr[data-row]").each(function () { $(this).toggle(!q || $(this).text().toLowerCase().includes(q)); });
        if (!q) { $page.find(".mta-panel, .mta-kpi-card").show(); return; }
        $page.find(".mta-kpi-card").each(function () { $(this).toggle($(this).text().toLowerCase().includes(q)); });
    }

    // ============================================================
    // DATA LOADING
    // ============================================================
    function loadUsers() {
        return new Promise((resolve) => {
            frappe.call({
                method: methodRoot + "get_users",
                callback: (r) => {
                    state.users = r.message || [];
                    const $sel = $("#mta-user");
                    state.users.forEach((u) => $sel.append(`<option value="${u.name}">${escapeHTML(u.full_name || u.name)}</option>`));
                    resolve();
                },
                error: resolve,
            });
            frappe.call({
                method: methodRoot + "get_territories",
                callback: (r) => {
                    const $sel = $("#mta-territory");
                    (r.message || []).forEach((t) => $sel.append(`<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`));
                },
            });
        });
    }

    function loadPageData(force) {
        if (state.loading) return;
        state.loading = true;
        setStatus("loading");

        frappe.call({
            method: methodRoot + (force ? "refresh_data" : "get_page_data"),
            args: { filters: JSON.stringify(state.filters) },
            freeze: false,
            callback: (r) => {
                state.loading = false;
                if (!r.message) { setStatus("error"); return; }
                state.data = r.message;
                renderDashboard();
                setStatus("ok");
            },
            error: () => { state.loading = false; setStatus("error"); },
        });

        frappe.call({
            method: methodRoot + "get_kpi_trends",
            args: { filters: JSON.stringify(state.filters) },
            callback: (r) => { if (r.message) { state.trends = r.message; renderSparklines(); } },
        });
    }

    function setStatus(s) {
        const $dot = $("#mta-status .mta-brand-dot");
        $dot.removeClass("is-loading is-error");
        if (s === "loading") $dot.addClass("is-loading");
        if (s === "error") $dot.addClass("is-error");
    }

    function downloadChartCsv(key) {
        const params = new URLSearchParams({
            cmd: methodRoot + "export_chart_csv",
            chart_key: key,
            filters: JSON.stringify(state.filters),
        });
        window.open(`/api/method/${methodRoot}export_chart_csv?${params.toString()}`, "_blank");
    }

    // ── List-view URL builders (used by Period Meetings "view all" + KPI cards) ──
    function buildMeetingListUrl() {
        const d = state.data;
        if (!d) return "/app/meeting";
        const params = new URLSearchParams();
        params.set("party_type", "Customer");
        params.set("docstatus", "1");
        params.set("meeting_from", JSON.stringify(["Between", [d.from_date, d.to_date]]));
        if (state.filters.user) {
            params.set("meeting_arranged_by", state.filters.user);
        }
        return `/app/meeting?${params.toString()}`;
    }

    function buildMeetingScheduleUrl() {
        const d = state.data;
        if (!d) return "/app/meeting-schedule";
        const params = new URLSearchParams();
        params.set("party_type", "Customer");
        params.set("scheduled_from", JSON.stringify(["Between", [d.from_date, d.to_date]]));
        if (state.filters.user) {
            params.set("meeting_arranged_by", state.filters.user);
        }
        return `/app/meeting-schedule?${params.toString()}`;
    }

    function buildCustomerListUrl() {
        // "New Customers" is a computed per-customer check on the backend (earliest-ever
        // meeting/schedule falling on/after the period start), so this can only carry the
        // territory filter over — not an exact match for the KPI's count.
        const params = new URLSearchParams();
        if (state.filters.territory) {
            params.set("territory", state.filters.territory);
        }
        return `/app/customer?${params.toString()}`;
    }

    // ============================================================
    // EMPLOYEE CATEGORY DRILL-DOWN
    // ============================================================
    function openEmployeeCategoryModal(employeeEmail, employeeName) {
        $("#mta-emp-category-title").text(`Meetings by Category`);
        $("#mta-emp-category-subtitle").text(employeeName);
        $("#mta-emp-category-body").html('<div class="mta-shimmer" style="height:200px; border-radius:10px;"></div>');
        $("#mta-emp-category-modal").css("display", "flex");

        frappe.call({
            method: methodRoot + "get_employee_meetings_by_category",
            args: {
                employee_email: employeeEmail,
                filters: JSON.stringify(state.filters),
            },
            callback: (r) => {
                const data = r.message || [];
                renderEmployeeCategoryContent(data, employeeName);
            },
            error: () => {
                $("#mta-emp-category-body").html(emptyState("Failed to load data"));
            },
        });
    }

    function renderEmployeeCategoryContent(data, employeeName) {
        const $body = $("#mta-emp-category-body");

        if (!data || !data.length) {
            $body.html(emptyState("No meetings found for this employee"));
            return;
        }

        const totalMeetings = data.reduce((sum, g) => sum + g.count, 0);

        let html = `
            <div class="mta-emp-category-summary">
                <div class="mta-emp-category-total">
                    <span class="mta-emp-category-total-num">${totalMeetings}</span>
                    <span class="mta-emp-category-total-label">Total Meetings</span>
                </div>
                <div class="mta-emp-category-chips">
                    ${data.map((g, i) => `
                        <span class="mta-emp-category-chip" style="background:${CHART_COLORS[i % CHART_COLORS.length]}22; color:${CHART_COLORS[i % CHART_COLORS.length]}; border-color:${CHART_COLORS[i % CHART_COLORS.length]}44;">
                            ${gradeBadge(g.grade)} <strong>${g.count}</strong>
                        </span>
                    `).join("")}
                </div>
            </div>
        `;

        html += `<div class="mta-emp-category-accordion">`;

        data.forEach((group, idx) => {
            const color = CHART_COLORS[idx % CHART_COLORS.length];
            const pct = totalMeetings > 0 ? Math.round((group.count / totalMeetings) * 100) : 0;

            html += `
                <div class="mta-category-group">
                    <div class="mta-category-header ${idx === 0 ? 'is-open' : ''}" style="border-left: 4px solid ${color};">
                        <div class="mta-category-header-left">
                            ${gradeBadge(group.grade)}
                            <span class="mta-category-grade-name">${escapeHTML(group.grade === 'Unclassified' ? 'Unclassified' : 'Grade ' + group.grade)}</span>
                        </div>
                        <div class="mta-category-header-right">
                            <div class="mta-category-bar-wrap">
                                <div class="mta-category-bar" style="width:${pct}%; background:${color};"></div>
                            </div>
                            <span class="mta-category-count" style="color:${color};">${group.count}</span>
                            <span class="mta-category-pct">${pct}%</span>
                            <span class="mta-category-chevron">${iconSvg("chevron")}</span>
                        </div>
                    </div>
                    <div class="mta-category-content" ${idx === 0 ? 'style="display:block;"' : ''}>
                        <table class="mta-table mta-table-nested">
                            <thead>
                                <tr>
                                    <th style="width:100px;">Date</th>
                                    <th style="width:80px;">Time</th>
                                    <th>Customer</th>
                                    <th style="width:60px;">Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${group.meetings.map((m) => `
                                    <tr data-row>
                                        <td style="white-space:nowrap; color:var(--mta-text-3);">${escapeHTML(m.date)}</td>
                                        <td style="white-space:nowrap; color:var(--mta-text-3);">${escapeHTML(m.time)}</td>
                                        <td class="mta-td-bold">${escapeHTML(m.customer)}</td>
                                        <td>${gradeBadge(m.grade)}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                        ${group.meetings.length === 0 ? '<div class="mta-empty-state" style="padding:16px;"><p>No meetings in this category</p></div>' : ''}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        $body.html(html);
    }

    // ============================================================
    // RENDER
    // ============================================================
    function renderDashboard() {
        const d = state.data;
        $("#mta-range-summary").html(`<span>${humanRange(d.from_date, d.to_date)}</span> <em style="font-style:normal; opacity:.7; margin-left:6px;">vs ${humanRange(d.prev_from_date, d.prev_to_date)}</em>`);
        $("#mta-team-period").text(d.period_label);
        $("#mta-daily-activity-period").text("Today");

        renderKPIs();
        renderGradeDonut();
        renderTerritoryBars("#mta-territory-bars", d.charts.territory_achievement, false);
        renderTerritoryBars("#mta-territory-bars-full", d.charts.territory_achievement, true);
        renderTerritoryTable();
        renderTeamInline();
        renderTeamFull();
        renderDailyActivity();
        renderPeriodMeetings();
        renderTrendChart();
    }

    function renderKPIs() {
        const cards = state.data.cards || {};
        const meta = state.data.meta?.card_meta || {};
        let insightsHtml = "";

        const html = CARD_ORDER.filter((k) => cards[k]).map((key) => {
            const card = cards[key];
            const m = meta[key] || {};
            const palette = PALETTE[m.color || card.color] || PALETTE.blue;
            const value = Number(card.value) || 0;
            const type = m.fieldtype || card.fieldtype || "Int";
            const delta = card.delta_pct;
            const hasDelta = delta !== null && delta !== undefined;
            const deltaCls = !hasDelta ? "is-flat" : delta > 0 ? "is-up" : delta < 0 ? "is-down" : "is-flat";
            const deltaTxt = hasDelta ? `${delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} ${Math.abs(delta).toFixed(1)}%` : "• Current";
            const label = m.label || card.label || key;
            const description = m.description || card.description || "";
            const clickable = !!CARD_ROUTES[key];

            if (hasDelta && Math.abs(delta) >= 10) {
                const verb = delta > 0 ? "up" : "down";
                const color = delta > 0 ? "#10B981" : "#EF4444";
                insightsHtml += `<div class="mta-insight-chip"><span style="color:${color};">${delta > 0 ? "▲" : "▼"}</span> <strong>${escapeHTML(label)}</strong> is ${verb} <span style="color:${color}; font-weight:800;">${Math.abs(delta).toFixed(1)}%</span> vs previous period.</div>`;
            }

            const tooltip = description ? `<span class="mta-custom-tooltip mta-kpi-info" data-tooltip="${escapeHTML(description)}">${iconSvg("info")}</span>` : "";

            return `<div class="mta-kpi-card ${clickable ? "mta-kpi-clickable" : ""}" data-kpi="${key}" style="--kpi-fg:${palette.fg}; --kpi-bg:${palette.bg};">
                <div class="mta-kpi-topline">
                    <div class="mta-kpi-icon-wrap">${iconSvg(m.icon || card.icon || "chart")}</div>
                    <div class="mta-kpi-title-wrap"><span class="mta-kpi-label">${escapeHTML(label)}</span></div>
                    ${tooltip}
                </div>
                <div class="mta-kpi-main">
                    <div class="mta-kpi-value" data-target="${value}" data-type="${type}">${formatValue(0, type)}</div>
                    <span class="mta-kpi-delta ${deltaCls}">${deltaTxt}</span>
                </div>
                <div class="mta-spark" id="mta-spark-${key}"></div>
            </div>`;
        }).join("");

        $("#mta-insights").html(insightsHtml);
        $("#mta-kpis").html(html);

        setTimeout(() => {
            $("#mta-kpis .mta-kpi-value").each(function () {
                const $el = $(this);
                animateValue($el[0], 0, parseFloat($el.data("target")) || 0, 700, $el.data("type"));
            });
            renderSparklines();
        }, 60);
    }

    function renderSparklines() {
        const actual = state.trends?.actual || [0, 0, 0, 0, 0, 0];
        const scheduled = state.trends?.scheduled || actual;
        const cards = state.data?.cards || {};
        const achievement = actual.map((v, i) => (scheduled[i] ? Math.min((v / scheduled[i]) * 100, 150) : 0));

        const sparkConfig = {
            scheduled_meetings: { values: scheduled, color: PALETTE.purple.fg },
            actual_meetings: { values: actual, color: PALETTE.blue.fg },
            achievement_pct: { values: achievement, color: PALETTE.green.fg },
            avg_per_day: { values: actual, color: PALETTE.teal.fg },
            new_customers: { values: actual.map((v) => v * 0.3), color: PALETTE.orange.fg },
        };
        Object.keys(sparkConfig).forEach((key) => drawSpark(`mta-spark-${key}`, sparkConfig[key].values, sparkConfig[key].color));
    }

    function drawSpark(id, values, color) {
        const el = document.getElementById(id);
        if (!el || !values || !values.length) return;
        const w = 120, h = 40, pad = 4;
        const drawH = h - pad * 2;
        const max = Math.max(...values, 1), min = Math.min(...values, 0);
        const range = max - min || 1;
        const step = values.length > 1 ? w / (values.length - 1) : w;
        const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(pad + drawH - ((v - min) / range) * drawH).toFixed(1)}`).join(" ");
        const area = `0,${h - pad} ${pts} ${w},${h - pad}`;
        el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none">
            <polygon points="${area}" fill="${color}" opacity="0.15"/>
            <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    }

    function animateValue(el, start, end, duration, type) {
		// Don't animate if value is N/A
		if (end === "N/A" || end === null || end === undefined) {
			el.textContent = "N/A";
			return;
		}
		let t0 = null;
		function step(t) {
			if (!t0) t0 = t;
			const p = Math.min((t - t0) / duration, 1);
			const eased = 1 - Math.pow(1 - p, 4);
			el.textContent = formatValue(start + (end - start) * eased, type);
			if (p < 1) requestAnimationFrame(step);
		}
		requestAnimationFrame(step);
	}

    function formatValue(v, type) {
		// Show N/A when backend sends "N/A" (Scheduled = 0)
		if (v === "N/A" || v === null || v === undefined) {
			return "N/A";
		}
		if (type === "percentage") return `${v.toFixed(1)}%`;
		if (type === "Float") return v.toFixed(2);
		return formatCompact(v);
	}

    function formatCompact(v) {
        v = Number(v) || 0;
        if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + "M";
        if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + "K";
        return Math.round(v).toLocaleString();
    }

    // ── Date formatter: dd-mm-yy ───────────────────────────────────────
    function humanRange(a, b) {
        if (!a || !b) return "";
        const fmt = (d) => {
            if (!d) return "";
            const parts = String(d).split("-");
            if (parts.length >= 3) {
                const yy = parts[0].slice(2);
                return `${parts[2]}-${parts[1]}-${yy}`;
            }
            return d;
        };
        return a === b ? fmt(a) : `${fmt(a)} – ${fmt(b)}`;
    }

    // ── Trend chart (frappe.Chart — no external CDN dependency) ──────────
    function renderTrendChart() {
        const el = document.getElementById("mta-chart-meeting_trend");
        if (!el) return;
        const trend = state.data.charts.meeting_trend;
        if (!trend || !trend.labels.length) { el.innerHTML = emptyState("No meetings in this period"); return; }
        el.innerHTML = "";
        new frappe.Chart(el, {
            title: "", type: "line", height: 260,
            colors: [PALETTE.blue.fg, PALETTE.purple.fg],
            data: {
                labels: trend.labels,
                datasets: [
                    { name: "Actual Meetings", values: trend.actual },
                    { name: "Scheduled Meetings", values: trend.scheduled },
                ],
            },
            lineOptions: { regionFill: 1, spline: 1, hideDots: 0, dotSize: 4 },
            axisOptions: { xAxisMode: "tick", yAxisMode: "span", xIsSeries: 1 },
            tooltipOptions: { formatTooltipY: (d) => d + " meetings" },
        });
    }

    // ── Grade donut + legend + drill-down ─────────────────────────────────
    function buildDonutSvg(segments, size) {
        size = size || 160;
        const radius = size * 0.42;
        const stroke = size * 0.13;
        const cx = size / 2, cy = size / 2;
        const circumference = 2 * Math.PI * radius;
        const total = segments.reduce((a, s) => a + s.count, 0) || 1;
        let offset = 0;
        const circles = segments.map((s, i) => {
            const frac = s.count / total;
            const dash = frac * circumference;
            const circle = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${CHART_COLORS[i % CHART_COLORS.length]}" stroke-width="${stroke}" stroke-dasharray="${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"/>`;
            offset += dash;
            return circle;
        }).join("");
        return `<svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <g transform="rotate(-90 ${cx} ${cy})">${circles}</g>
        </svg>`;
    }

    function donutLegendHtml(segments) {
        return donut_segments_to_pills(segments) + `<div class="mta-legend-hint">Click a grade to drill down</div>`;
    }
    function donut_segments_to_pills(segments) {
        return segments.map((s, i) => `
            <button class="mta-legend-pill" data-grade="${escapeHTML(s.label)}" title="${s.count} meetings — ${s.pct}%">
                <span class="mta-legend-dot" style="background:${CHART_COLORS[i % CHART_COLORS.length]};"></span>${escapeHTML(s.label)}
            </button>`).join("");
    }

    function renderGradeDonut() {
        const el = document.getElementById("mta-grade-donut");
        if (!el) return;
        const donut = state.data.charts.grade_donut;
        if (!donut || !donut.segments.length) { el.innerHTML = emptyState("No meetings in this period"); return; }

        el.innerHTML = `
            <div class="mta-donut-wrap-v2">
                <div class="mta-donut-ring-wrap">
                    ${buildDonutSvg(donut.segments, 160)}
                    <div class="mta-donut-center-text"><div class="mta-donut-total-label">Total</div><div class="mta-donut-total-value">${donut.total}</div></div>
                </div>
                <div class="mta-donut-legend-row">${donutLegendHtml(donut.segments)}</div>
            </div>`;

        el.querySelectorAll(".mta-legend-pill").forEach((btn) => {
            btn.addEventListener("click", () => {
                const grade = btn.dataset.grade;
                if (state._selectedGrade === grade) {
                    state._selectedGrade = null;
                    el.querySelectorAll(".mta-legend-pill").forEach((b) => b.classList.remove("is-selected"));
                    $("#mta-grade-drill").html("");
                    return;
                }
                state._selectedGrade = grade;
                el.querySelectorAll(".mta-legend-pill").forEach((b) => b.classList.remove("is-selected"));
                btn.classList.add("is-selected");
                renderGradeDrill(grade);
            });
        });
    }

    function renderGradeDrill(grade, limit) {
        limit = limit || 10;
        const $el = $("#mta-grade-drill");
        frappe.call({
            method: methodRoot + "get_grade_meetings",
            args: { grade, filters: JSON.stringify(state.filters), limit },
            callback: (r) => {
                const data = r.message || { total: 0, rows: [] };
                if (!data.rows.length) {
                    $el.html(`<div class="mta-grade-drill"><div class="mta-drill-header">${gradeBadge(grade)}<span class="mta-drill-label">Meetings</span><span class="mta-drill-count">(0)</span><span class="mta-drill-close">×</span></div><div class="mta-empty-state" style="margin:16px;"><p>No meetings found</p></div></div>`);
                } else {
                    const rows = data.rows.map((m) => `<tr><td style="white-space:nowrap; color:var(--mta-text-3);">${escapeHTML(m.date)}</td><td>${escapeHTML(m.employee)}</td><td>${escapeHTML(m.customer)}</td></tr>`).join("");
                    const hasMore = data.total > data.rows.length;
                    $el.html(`
                        <div class="mta-grade-drill">
                            <div class="mta-drill-header">${gradeBadge(grade)}<span class="mta-drill-label">Meetings</span><span class="mta-drill-count">(${data.total} total)</span><span class="mta-drill-close">×</span></div>
                            <table class="mta-table"><thead><tr><th>Date</th><th>Employee</th><th>Customer</th></tr></thead><tbody>${rows}</tbody></table>
                            ${hasMore ? `<div class="mta-drill-more mta-drill-view-all" style="cursor:pointer; font-weight:700; color:var(--mta-primary);">Showing ${data.rows.length} of ${data.total} — View all →</div>` : ""}
                        </div>`);
                }
                $el.find(".mta-drill-close").on("click", () => {
                    state._selectedGrade = null;
                    $el.html("");
                    $("#mta-grade-donut .mta-legend-row").removeClass("is-selected");
                });
                $el.find(".mta-drill-view-all").on("click", () => renderGradeDrill(grade, 200));
            },
        });
    }

    function gradeBadge(g) {
        const map = { A: "a", B: "b", C: "c", D: "d" };
        const cls = map[g] || "x";
        return `<span class="mta-grade mta-grade-${cls}">${escapeHTML(g || "Unclassified")}</span>`;
    }

    // ── Territory bars ─────────────────────────────────────────────────
    function renderTerritoryBars(sel, rows, showAll) {
        const el = document.querySelector(sel);
        if (!el) return;
        if (!rows || !rows.length) { el.innerHTML = emptyState("No territory data"); return; }

        const list = rows.slice().sort((a, b) => (b.actual || 0) - (a.actual || 0)).slice(0, showAll ? 30 : 10);
        const maxMeetings = list[0]?.actual || 1;

        el.innerHTML = `<div class="mta-hbar-list">${list.map((t, i) => {
            const actual = t.actual || 0;
            const relativePct = Math.round((actual / maxMeetings) * 1000) / 10;
            const w = relativePct;
            const color = CHART_COLORS[i % CHART_COLORS.length];

            return `
                <div class="mta-hbar-row">
                    <div class="mta-hbar-track">
                        <div class="mta-hbar-fill" style="width:0%; background:${color}22;" data-target="${w}%"></div>
                        <div class="mta-hbar-content">
                            <div class="mta-hbar-label"><span class="mta-hbar-rank">${i + 1}</span>${escapeHTML(t.territory)}</div>
                            <div class="mta-hbar-meet-count" style="color:${color}; font-weight:700; font-size:13px;">${actual} Meet</div>
                        </div>
                    </div>
                </div>`;
        }).join("")}</div>`;

        setTimeout(() => el.querySelectorAll(".mta-hbar-fill").forEach((bar) => (bar.style.width = bar.dataset.target)), 50);
    }

    function renderTerritoryTable() {
        const el = document.getElementById("mta-territory-table");
        if (!el) return;
        const rows = state.data.territory_table || [];
        if (!rows.length) { el.innerHTML = emptyState("No territory data"); return; }
        el.innerHTML = `
            <table class="mta-table">
                <thead><tr><th>Territory</th><th>Scheduled</th><th>Actual</th><th>Achievement %</th></tr></thead>
                <tbody>${rows.map((r) => `
                    <tr data-row>
                        <td class="mta-td-bold">${escapeHTML(r.territory)}</td>
                        <td>${r.scheduled}</td>
                        <td class="mta-td-bold">${r.actual}</td>
                        <td>${achievementPill(r.achievement_pct, r.scheduled)}</td>
                    </tr>`).join("")}</tbody>
            </table>`;
    }

    function achievementPill(pct, denom) {
        if (!denom || pct == null) return `<span class="mta-pill-info">N/A</span>`;
        const cls = pct >= 90 ? "mta-pill-hi" : pct >= 60 ? "mta-pill-warn" : "mta-pill-danger";
        return `<span class="${cls}">${pct}%</span>`;
    }

    // ── Team ─────────────────────────────────────────────────────────
	function teamTableHtml(rows, limit) {
		if (!rows.length) return emptyState("No team data for selected filters");
		const show = limit ? rows.slice(0, limit) : rows;
		const totals = rows.reduce((a, r) => ({
			meeting_target: a.meeting_target + (r.meeting_target || 0),
			target: a.target + r.target,
			actual: a.actual + r.actual,
			customers: a.customers + r.customers
		}), { meeting_target: 0, target: 0, actual: 0, customers: 0 });

		// Average of each employee's own Achievement % — only counting employees who
		// have a real denominator (meeting_target or scheduled) to measure against.
		const achValues = rows
			.filter((r) => (r.meeting_target || r.target))
			.map((r) => r.achievement_pct)
			.filter((v) => v !== null && v !== undefined && !isNaN(v));
		const tAch = achValues.length
			? Math.round((achValues.reduce((sum, v) => sum + v, 0) / achValues.length) * 10) / 10
			: null;

		return `
			<table class="mta-table mta-table-team">
				<thead>
					<tr>
						<th>Employee</th>
						<th>Meeting Target</th>
						<th>Scheduled</th>
						<th>Actual</th>
						<th>Achievement %</th>
					</tr>
				</thead>
				<tbody>${show.map((r) => `
					<tr data-row>
						<td class="mta-td-bold mta-td-employee">
							${r.employee_email ? `<button class="mta-emp-expand-btn" data-email="${escapeHTML(r.employee_email)}" data-name="${escapeHTML(r.employee)}" title="View meetings by category">${iconSvg("plus")}</button>` : ''}
							<span class="mta-emp-name">${escapeHTML(r.employee)}</span>
						</td>
						<td>
							<div class="mta-target-cell">
								<span class="mta-target-value">${r.meeting_target || 0}</span>
								${r.base_meeting_target && r.target_multiplier && r.target_multiplier > 1 ?
									`<span class="mta-target-base" title="Monthly target: ${r.base_meeting_target} × ${r.target_multiplier} months">(${r.base_meeting_target}×${r.target_multiplier})</span>` : ''}
							</div>
						</td>
						<td>${r.target}</td>
						<td class="mta-td-bold">${r.actual}</td>
						<td>${achievementPill(r.achievement_pct, r.meeting_target || r.target)}</td>
					</tr>`).join("")}
				</tbody>
				<tfoot><tr>
					<td class="mta-td-bold">Total</td>
					<td>${totals.meeting_target}</td>
					<td>${totals.target}</td>
					<td>${totals.actual}</td>
					<td>${achievementPill(tAch, totals.meeting_target || totals.target)}</td>
				</tr></tfoot>
			</table>
			${limit && rows.length > limit ? `<div class="mta-view-all" id="mta-team-more">View all ${rows.length} employees →</div>` : ""}`;
	}

	function renderTeamInline() {
		const rows = state.data.team_table || [];
		$("#mta-team-inline").html(teamTableHtml(rows, 5));
		$("#mta-team-more").on("click", () => { $(`.mta-tab[data-view="team"]`).trigger("click"); });
	}

	function renderTeamFull() {
		$("#mta-team-full").html(teamTableHtml(state.data.team_table || [], null));
	}

    // ── Activity ─────────────────────────────────────────────────────
    function statusBadge(type) {
        return type === "Held" ? `<span class="mta-status mta-s-done">Held</span>` : `<span class="mta-status mta-s-sched">Scheduled</span>`;
    }

    function dailyActivityActionBtn(r) {
        if (!r.meeting_name) return "";
        if (r.meeting_type === "Held") {
            return `<button class="mta-btn-sm mta-open-meeting-btn" data-meeting="${escapeHTML(r.meeting_name)}">${iconSvg("video")} Open Meeting</button>`;
        }
        return `<button class="mta-btn-sm mta-open-schedule-btn" data-schedule="${escapeHTML(r.meeting_name)}">${iconSvg("calendar")} View Schedule</button>`;
    }

    function renderDailyActivity() {
        const rows = state.data.daily_activity || [];
        const el = document.getElementById("mta-daily-activity");
        if (!rows.length) { el.innerHTML = emptyState("No activity in this period"); return; }
        el.innerHTML = `
            <table class="mta-table">
                <thead><tr><th>Date</th><th>Time</th><th>Employee</th><th>Customer</th><th>Grade</th><th>Status</th><th></th></tr></thead>
                <tbody>${rows.map((r) => `
                    <tr data-row>
                        <td style="white-space:nowrap; color:var(--mta-text-3);">${escapeHTML(r.date || "")}</td>
                        <td style="white-space:nowrap; color:var(--mta-text-3); font-weight:600;">${escapeHTML(r.time)}</td>
                        <td class="mta-td-bold">${escapeHTML(r.employee)}</td>
                        <td>${escapeHTML(r.customer)}</td>
                        <td>${gradeBadge(r.grade)}</td>
                        <td>${statusBadge(r.meeting_type)}</td>
                        <td>${dailyActivityActionBtn(r)}</td>
                    </tr>`).join("")}
                </tbody>
            </table>`;
    }

    // ── Period Meetings (supports optional grouping) ─────────────────
    function renderPeriodMeetings() {
        const allRows = state.data.period_meetings || [];
        const el = document.getElementById("mta-period-meetings");
        if (!rowsExist(allRows, el)) return;

        if (state.periodGroupBy) {
            renderPeriodMeetingsGrouped(allRows, el);
            return;
        }

        const rows = allRows.slice(0, 50);
        el.innerHTML = `
            <table class="mta-table">
                <thead><tr><th>Date</th><th>Time</th><th>Employee</th><th>Customer</th><th>Grade</th><th></th></tr></thead>
                <tbody>${rows.map((m) => `
                    <tr data-row>
                        <td style="white-space:nowrap; color:var(--mta-text-3);">${escapeHTML(m.date)}</td>
                        <td style="white-space:nowrap; color:var(--mta-text-3);">${escapeHTML(m.time)}</td>
                        <td class="mta-td-bold">${escapeHTML(m.employee)}</td>
                        <td>${escapeHTML(m.customer)}</td>
                        <td>${gradeBadge(m.grade)}</td>
                        <td>${m.meeting_name ? `<button class="mta-btn-sm mta-open-meeting-btn" data-meeting="${escapeHTML(m.meeting_name)}">${iconSvg("video")} Open Meeting</button>` : ""}</td>
                    </tr>`).join("")}
                </tbody>
            </table>
            ${allRows.length > 50 ? `<div class="mta-view-all" id="mta-period-view-all" style="cursor:pointer;">Showing 50 of ${allRows.length} </div>` : ""}`;
    }

    function rowsExist(rows, el) {
        if (!rows.length) { el.innerHTML = emptyState("No meetings in this period"); return false; }
        return true;
    }

    function renderPeriodMeetingsGrouped(rows, el) {
        const key = state.periodGroupBy; // "customer" | "grade" | "employee"
        const grouped = {};
        rows.forEach((r) => {
            const k = r[key] || "Unassigned";
            (grouped[k] = grouped[k] || []).push(r);
        });

        let entries = Object.entries(grouped).map(([label, items]) => ({ label, items, count: items.length }));

        if (key === "grade") {
            entries.sort((a, b) => {
                const rank = (g) => (g === "Unclassified" ? 999 : (g.length === 1 && /[A-Za-z]/.test(g) ? g.toUpperCase().charCodeAt(0) : 500));
                return rank(a.label) - rank(b.label) || a.label.localeCompare(b.label);
            });
        } else {
            entries.sort((a, b) => b.count - a.count);
        }

        const total = rows.length;

        let html = `<div class="mta-emp-category-accordion" style="padding:16px;">`;
        entries.forEach((group, idx) => {
            const color = CHART_COLORS[idx % CHART_COLORS.length];
            const pct = total ? Math.round((group.count / total) * 100) : 0;

            html += `
                <div class="mta-category-group">
                    <div class="mta-category-header ${idx === 0 ? "is-open" : ""}" style="border-left:4px solid ${color};">
                        <div class="mta-category-header-left">
                            ${key === "grade" ? gradeBadge(group.label) : `<span class="mta-category-grade-name">${escapeHTML(group.label)}</span>`}
                        </div>
                        <div class="mta-category-header-right">
                            
                            <span class="mta-category-count" style="color:${color};">${group.count}</span>
                            
                            <span class="mta-category-chevron">${iconSvg("chevron")}</span>
                        </div>
                    </div>
                    <div class="mta-category-content" ${idx === 0 ? 'style="display:block;"' : ""}>
                        <table class="mta-table mta-table-nested">
                            <thead><tr>
                                <th style="width:100px;">Date</th>
                                <th style="width:80px;">Time</th>
                                ${key !== "employee" ? "<th>Employee</th>" : ""}
                                ${key !== "customer" ? "<th>Customer</th>" : ""}
                                ${key !== "grade" ? "<th style='width:60px;'>Grade</th>" : ""}
                                <th></th>
                            </tr></thead>
                            <tbody>
                                ${group.items.map((m) => `
                                    <tr data-row>
                                        <td style="white-space:nowrap; color:var(--mta-text-3);">${escapeHTML(m.date)}</td>
                                        <td style="white-space:nowrap; color:var(--mta-text-3);">${escapeHTML(m.time)}</td>
                                        ${key !== "employee" ? `<td class="mta-td-bold">${escapeHTML(m.employee)}</td>` : ""}
                                        ${key !== "customer" ? `<td>${escapeHTML(m.customer)}</td>` : ""}
                                        ${key !== "grade" ? `<td>${gradeBadge(m.grade)}</td>` : ""}
                                        <td>${m.meeting_name ? `<button class="mta-btn-sm mta-open-meeting-btn" data-meeting="${escapeHTML(m.meeting_name)}">${iconSvg("video")} Open Meeting</button>` : ""}</td>
                                    </tr>`).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>`;
        });
        html += `</div>`;
        el.innerHTML = html;
    }

    // ── Chart expand modal ──────────────────────────────────────────────
    function openChartModal(key) {
        const titles = { meeting_trend: "Meeting Trend", grade_donut: "Meetings by Customer Grade", territory_achievement: "Achievement % by Territory" };
        $("#mta-chart-modal-title").text(titles[key] || key);
        $("#mta-chart-modal-body").html('<div id="mta-modal-chart-target" style="min-height:360px;"></div>');
        $("#mta-chart-modal").css("display", "flex");

        if (key === "meeting_trend") {
            const trend = state.data.charts.meeting_trend;
            new frappe.Chart("#mta-modal-chart-target", {
                title: "", type: "line", height: 340, colors: [PALETTE.blue.fg, PALETTE.purple.fg],
                data: { labels: trend.labels, datasets: [{ name: "Actual", values: trend.actual }, { name: "Scheduled", values: trend.scheduled }] },
                lineOptions: { regionFill: 1, spline: 1 },
                axisOptions: { xAxisMode: "tick", xIsSeries: 1 },
            });
        } else if (key === "grade_donut") {
            const donut = state.data.charts.grade_donut;
            new frappe.Chart("#mta-modal-chart-target", {
                title: "", type: "donut", height: 340,
                data: { labels: donut.segments.map((s) => s.label), datasets: [{ values: donut.segments.map((s) => s.count) }] },
                colors: CHART_COLORS,
            });
        } else if (key === "territory_achievement") {
            const rows = state.data.charts.territory_achievement;
            new frappe.Chart("#mta-modal-chart-target", {
                title: "", type: "bar", height: 340, colors: [PALETTE.green.fg],
                data: { labels: rows.map((r) => r.territory), datasets: [{ name: "Achievement %", values: rows.map((r) => r.achievement_pct || 0) }] },
            });
        }
    }

    // ============================================================
    // EXPORT (browser print → Save as PDF, same approach as Nayla Analytics)
    // ============================================================
    function runExport() {
        $("#mta-export-modal").hide();
        const printStyle = document.createElement("style");
        printStyle.id = "mta-print-style";
        printStyle.textContent = `
            @media print {
                body > *:not(.main-section) { display:none !important; }
                .navbar, .page-head, .layout-side-section, .sidebar-wrapper, .frappe-control,
                #mta-export-modal, #mta-chart-modal, #mta-emp-category-modal, .form-tabs, .form-dashboard, .form-footer { display:none !important; }
                html, body { height:auto !important; overflow:visible !important; }
                .main-section, .layout-main-section-wrapper, .layout-main-section, .page-body,
                .container.page-body { display:block !important; margin:0 !important; padding:0 !important; width:100% !important; height:auto !important; overflow:visible !important; }
                .mta-page, .mta-shell { visibility:visible !important; display:block !important; width:100% !important; margin:0 !important; padding:10px !important; height:auto !important; overflow:visible !important; }
                .mta-page { background:#fff !important; }
                .mta-page, .mta-page * {
                    --mta-bg:#fff !important; --mta-surface:#fff !important; --mta-surface-2:#f8fafc !important;
                    --mta-border:#e2e8f0 !important; --mta-text:#0f172a !important; --mta-text-2:#334155 !important; --mta-text-3:#64748b !important;
                    -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important;
                }
                .mta-kpi-card, .mta-panel { break-inside:avoid; page-break-inside:avoid; box-shadow:none !important; border:1px solid #e2e8f0 !important; }
                .mta-icon-btn, .mta-panel-actions, .mta-filter-bar, .mta-emp-expand-btn { display:none !important; }
                .mta-section:not([data-view="${state.view}"]) { display:none !important; }
                @page { size: A4 landscape; margin: 10mm; }
            }`;
        document.head.appendChild(printStyle);
        const cleanup = () => { document.getElementById("mta-print-style")?.remove(); window.removeEventListener("afterprint", cleanup); };
        window.addEventListener("afterprint", cleanup);
        setTimeout(() => window.print(), 100);
    }

    // ============================================================
    // THEME / FILTERS / URL STATE
    // ============================================================
    function toggleTheme() {
        state.theme = state.theme === "light" ? "dark" : "light";
        $page.attr("data-theme", state.theme);
        localStorage.setItem("mta-theme", state.theme);
    }

    function saveFiltersToURL() {
        const params = new URLSearchParams(window.location.search);
        Object.entries(state.filters).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
        window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    }

    function restoreFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);
        ["period_preset", "from_date", "to_date", "user", "territory"].forEach((k) => {
            if (params.has(k)) state.filters[k] = params.get(k);
        });
        if (state.filters.period_preset) $("#mta-preset").val(state.filters.period_preset);
        if (state.filters.period_preset === "custom") {
            $page.find(".mta-date-field").show();
            if (state.dateControls) {
                state.dateControls.from.set_value(state.filters.from_date);
                state.dateControls.to.set_value(state.filters.to_date);
            }
        }
        if (state.filters.user) $("#mta-user").val(state.filters.user);
        if (state.filters.territory) $("#mta-territory").val(state.filters.territory);
    }

    // ============================================================
    // ICONS
    // ============================================================
    function iconSvg(name) {
        const I = {
            calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
            users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
            check: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
            target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
            "trending-up": '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
            percent: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
            map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
            grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
            search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
            download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
            refresh: '<path d="M21 12a9 9 0 11-9-9c2.5 0 4.7 1 6.4 2.6L21 8M21 3v5h-5"/>',
            theme: '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>',
            info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
            expand: '<path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/>',
            video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
            close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
            plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
            chevron: '<polyline points="6 9 12 15 18 9"/>',
        };
        const size = name === "video" ? 12 : (name === "plus" || name === "chevron") ? 14 : 15;
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${I[name] || I.grid}</svg>`;
    }

    // ============================================================
    // STYLES — Bento Grid + Glassmorphism, matches Nayla Analytics tokens
    // ============================================================
    function injectStyles() {
        if ($("#mta-style").length) return;
        $("head").append(`
<style id="mta-style">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.mta-page {
    --mta-bg:#F8FAFC; --mta-surface:#FFFFFF; --mta-surface-2:#F1F5F9;
    --mta-border:#E2E8F0; --mta-border-soft:#F1F5F9; --mta-border-hover:#CBD5E1;
    --mta-text:#0F172A; --mta-text-2:#334155; --mta-text-3:#64748B;
    --mta-primary:#6366F1; --mta-primary-hover:#4F46E5;
    --mta-shadow: 0 4px 6px -1px rgba(0,0,0,.05), 0 2px 4px -1px rgba(0,0,0,.03);
    --mta-shadow-hover: 0 20px 25px -5px rgba(0,0,0,.1), 0 10px 10px -5px rgba(0,0,0,.04);
    --mta-tint-blue:#EEF2FF; --mta-tint-green:#ECFDF5; --mta-tint-purple:#F5F3FF; --mta-tint-orange:#FFF7ED;
    --mta-tint-teal:#F0FDFA; --mta-tint-amber:#FFFBEB; --mta-tint-red:#FEF2F2;
    background: var(--mta-bg);
    background-image: radial-gradient(at 0% 0%, rgba(99,102,241,.05) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(16,185,129,.03) 0px, transparent 50%);
    background-attachment: fixed;
    font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
    color: var(--mta-text);
    padding: 0 0 60px;
    -webkit-font-smoothing: antialiased;
}
.mta-page[data-theme="dark"] {
    --mta-bg:#0A0A0A; --mta-surface:#121212; --mta-surface-2:#1A1A1A;
    --mta-border:#262626; --mta-border-soft:#1E1E1E; --mta-border-hover:#404040;
    --mta-text:#F8FAFC; --mta-text-2:#CBD5E1; --mta-text-3:#64748B;
    --mta-primary:#818CF8; --mta-primary-hover:#6366F1;
    --mta-tint-blue:rgba(99,102,241,.15); --mta-tint-green:rgba(16,185,129,.15); --mta-tint-purple:rgba(139,92,246,.15);
    --mta-tint-orange:rgba(249,115,22,.15); --mta-tint-teal:rgba(20,184,166,.15); --mta-tint-amber:rgba(245,158,11,.15); --mta-tint-red:rgba(239,68,68,.15);
    background-image: radial-gradient(at 0% 0%, rgba(99,102,241,.08) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(139,92,246,.05) 0px, transparent 50%);
}
.mta-page * { box-sizing:border-box; transition: background-color .2s, border-color .2s; }
.mta-shell { max-width:1500px; margin:0 auto; padding:20px; }

/* ── Filter bar ─────────────────────────────────────────── */
.mta-filter-bar { background:var(--mta-surface); border-radius:16px; padding:12px 20px; display:flex; flex-direction:column; gap:10px; box-shadow:var(--mta-shadow); border:1px solid var(--mta-border); }
.mta-field { position:relative; display:flex; align-items:center; }
.mta-field-icon svg { position:absolute; left:12px; color:var(--mta-text-3); pointer-events:none; }
.mta-field select, .mta-field input { border:1px solid var(--mta-border); border-radius:10px; padding:6px 12px 6px 36px; font-size:13px; font-weight:600; color:var(--mta-text); background:var(--mta-surface-2); height:36px; min-width:150px; outline:none; font-family:inherit; appearance:none; cursor:pointer; }
.mta-field select:focus, .mta-field input:focus { border-color:var(--mta-primary); box-shadow:0 0 0 3px rgba(99,102,241,.15); background:var(--mta-surface); }
.mta-btn-apply { background:var(--mta-text); color:var(--mta-surface); border:none; border-radius:10px; padding:0 20px; height:36px; font-size:13px; font-weight:700; cursor:pointer; transition:transform .2s,opacity .2s; }
.mta-btn-apply:hover { transform:translateY(-1px); opacity:.9; }
.mta-range-summary { font-size:12px; font-weight:600; color:var(--mta-text-3); white-space:nowrap; }
.mta-search { display:flex; align-items:center; gap:8px; background:var(--mta-surface-2); border:1px solid transparent; border-radius:10px; padding:0 12px; height:36px; color:var(--mta-text-3); }
.mta-search:focus-within { border-color:var(--mta-primary); background:var(--mta-surface); }
.mta-search input { border:0; background:transparent; outline:0; font-size:13px; font-weight:500; color:var(--mta-text); width:160px; font-family:inherit; }
.mta-icon-btn { width:36px; height:36px; border-radius:10px; border:1px solid var(--mta-border); background:var(--mta-surface); color:var(--mta-text-2); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .2s; }
.mta-icon-btn:hover { background:var(--mta-surface-2); color:var(--mta-text); transform:translateY(-1px); }
.mta-icon-btn.mta-mini { width:28px; height:28px; border-radius:8px; }

.mta-tabs-wrapper { display:flex; align-items:center; justify-content:space-between; border-top:1px solid var(--mta-border); padding-top:8px; }
.mta-tabs { display:flex; gap:6px; flex-wrap:wrap; }
.mta-tab { display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:10px; border:1px solid transparent; background:transparent; font-size:13px; font-weight:700; color:var(--mta-text-3); cursor:pointer; transition:all .2s; }
.mta-tab:hover { background:var(--mta-surface-2); color:var(--mta-text); }
.mta-tab.is-active { background:var(--mta-primary); color:#fff; }
.mta-brand-dot-wrap { display:flex; align-items:center; gap:8px; }
.mta-brand-dot { width:9px; height:9px; border-radius:50%; background:#10B981; box-shadow:0 0 0 0 rgba(16,185,129,.5); animation: mta-pulse-green 2s infinite; }
.mta-brand-dot.is-loading { background:#F59E0B; animation: mta-pulse-amber 1.5s infinite; }
.mta-brand-dot.is-error { background:#EF4444; animation:none; }
.mta-brand-meta { font-size:11.5px; color:var(--mta-text-3); font-weight:600; }
@keyframes mta-pulse-green { 0%{box-shadow:0 0 0 0 rgba(16,185,129,.5);} 70%{box-shadow:0 0 0 8px rgba(16,185,129,0);} 100%{box-shadow:0 0 0 0 rgba(16,185,129,0);} }
@keyframes mta-pulse-amber { 0%,100%{opacity:1;} 50%{opacity:.4;} }

/* ── Insights strip ─────────────────────────────────────── */
#mta-insights { margin:16px 0 8px; display:flex; flex-wrap:nowrap; gap:8px; overflow-x:auto; }
.mta-insight-chip { flex:0 0 auto; white-space:nowrap; background:var(--mta-surface); border:1px solid var(--mta-border); border-radius:999px; padding:4px 10px; font-size:11px; font-weight:650; color:var(--mta-text-2); box-shadow:var(--mta-shadow); }

/* ── KPI grid ───────────────────────────────────────────── */
.mta-kpi-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; margin-bottom:20px; }
@media(max-width:1100px){.mta-kpi-grid{grid-template-columns:repeat(3,1fr);}}
@media(max-width:700px){.mta-kpi-grid{grid-template-columns:1fr 1fr;}}
@media(max-width:480px){.mta-kpi-grid{grid-template-columns:1fr;}}

.mta-kpi-card { background:var(--mta-surface); border:1px solid var(--mta-border); border-radius:16px; padding:18px; display:flex; flex-direction:column; gap:10px; box-shadow:var(--mta-shadow); cursor:default; position:relative; overflow:hidden; }
.mta-kpi-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--kpi-fg); opacity:.6; }
.mta-kpi-card:hover { box-shadow:var(--mta-shadow-hover); transform:translateY(-2px); }
.mta-kpi-clickable { cursor:pointer; }
.mta-kpi-clickable:hover { border-color:var(--mta-primary); }
.mta-kpi-topline { display:flex; align-items:center; gap:10px; }
.mta-kpi-icon-wrap { width:34px; height:34px; border-radius:10px; background:var(--kpi-bg); display:flex; align-items:center; justify-content:center; }
.mta-kpi-icon-wrap svg { width:16px; height:16px; color:var(--kpi-fg); }
.mta-kpi-label { font-size:12px; font-weight:700; color:var(--mta-text-3); text-transform:uppercase; letter-spacing:.5px; }
.mta-kpi-info { margin-left:auto; opacity:.5; }
.mta-kpi-info svg { width:14px; height:14px; }
.mta-kpi-main { display:flex; align-items:baseline; gap:10px; }
.mta-kpi-value { font-size:28px; font-weight:900; color:var(--mta-text); line-height:1; }
.mta-kpi-delta { font-size:12px; font-weight:700; }
.mta-kpi-delta.is-up { color:#10B981; }
.mta-kpi-delta.is-down { color:#EF4444; }
.mta-kpi-delta.is-flat { color:var(--mta-text-3); }
.mta-spark { margin-top:auto; opacity:.8; }
.mta-kpi-skeleton { background:var(--mta-surface); border:1px solid var(--mta-border); border-radius:16px; height:130px; overflow:hidden; }

/* ── Bento grid ─────────────────────────────────────────── */
.mta-bento { display:grid; grid-template-columns:repeat(12,1fr); gap:14px; margin-bottom:20px; }
.mta-bento-span-12 { grid-column:span 12; }
.mta-bento-span-6 { grid-column:span 6; }
@media(max-width:900px){.mta-bento-span-6{grid-column:span 12;}}

.mta-section-title { display:flex; align-items:baseline; gap:10px; margin:24px 0 12px; }
.mta-section-title span { font-size:15px; font-weight:800; color:var(--mta-text); }
.mta-section-title em { font-size:12px; font-weight:500; color:var(--mta-text-3); font-style:italic; }
.mta-section-title-action { justify-content:space-between; align-items:center; flex-wrap:wrap; }
.mta-section-title-action .mta-field select { min-width:170px; height:32px; font-size:12px; }
.mta-section-title-action .mta-field-icon svg { width:13px; height:13px; }

/* ── Panel ──────────────────────────────────────────────── */
.mta-panel { background:var(--mta-surface); border:1px solid var(--mta-border); border-radius:16px; box-shadow:var(--mta-shadow); overflow:hidden; }
.mta-panel-head { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--mta-border-soft); }
.mta-panel-head h3 { font-size:14px; font-weight:800; color:var(--mta-text); }
.mta-panel-head .mta-subtitle { font-size:11.5px; color:var(--mta-text-3); margin-left:8px; }
.mta-panel-actions { display:flex; gap:6px; }
.mta-panel-body { padding:18px; }
.mta-panel-body.mta-p-0 { padding:0; }
.mta-chart-wrap { min-height:260px; position:relative; }

/* ── Table ──────────────────────────────────────────────── */
.mta-table { width:100%; border-collapse:collapse; font-size:13px; }
.mta-table thead th { text-align:left; padding:10px 14px; font-size:11px; font-weight:700; color:var(--mta-text-3); text-transform:uppercase; letter-spacing:.5px; background:var(--mta-surface-2); border-bottom:1px solid var(--mta-border); }
.mta-table tbody td { padding:10px 14px; border-bottom:1px solid var(--mta-border-soft); color:var(--mta-text-2); }
.mta-table tbody tr:hover { background:var(--mta-surface-2); }
.mta-table tfoot td { padding:10px 14px; font-weight:700; border-top:2px solid var(--mta-border); background:var(--mta-surface-2); color:var(--mta-text); }
.mta-td-bold { font-weight:700 !important; color:var(--mta-text) !important; }
.mta-table-nested { font-size:12px; }
.mta-table-nested thead th { padding:8px 12px; font-size:10px; }
.mta-table-nested tbody td { padding:8px 12px; }

/* ── Employee cell with + button ────────────────────────── */
.mta-td-employee { display:flex; align-items:center; gap:8px; }
.mta-emp-name { flex:1; }
.mta-emp-expand-btn { 
    width:26px; height:26px; border-radius:8px; border:1px solid var(--mta-border); 
    background:var(--mta-surface-2); color:var(--mta-primary); display:inline-flex; 
    align-items:center; justify-content:center; cursor:pointer; transition:all .2s; 
    flex-shrink:0; opacity:.7;
}
.mta-emp-expand-btn:hover { 
    background:var(--mta-primary); color:#fff; border-color:var(--mta-primary); 
    opacity:1; transform:scale(1.1); 
}

/* ── Target cell ────────────────────────────────────────── */
.mta-target-cell { display:flex; flex-direction:column; gap:2px; }
.mta-target-value { font-weight:700; color:var(--mta-text); }
.mta-target-base { font-size:10px; color:var(--mta-text-3); font-weight:500; }

/* ── Employee Category Modal / Grouped Tables ───────────── */
.mta-emp-category-summary { 
    display:flex; align-items:center; justify-content:space-between; gap:16px; 
    padding:16px; background:var(--mta-surface-2); border-radius:12px; margin-bottom:16px; 
    flex-wrap:wrap;
}
.mta-emp-category-total { display:flex; flex-direction:column; }
.mta-emp-category-total-num { font-size:32px; font-weight:900; color:var(--mta-text); line-height:1; }
.mta-emp-category-total-label { font-size:11px; font-weight:600; color:var(--mta-text-3); text-transform:uppercase; letter-spacing:.5px; margin-top:4px; }
.mta-emp-category-chips { display:flex; gap:8px; flex-wrap:wrap; }
.mta-emp-category-chip { 
    display:inline-flex; align-items:center; gap:6px; padding:6px 12px; 
    border-radius:999px; font-size:12px; font-weight:600; border:1px solid; 
}

.mta-emp-category-accordion { display:flex; flex-direction:column; gap:8px; }
.mta-category-group { border:1px solid var(--mta-border); border-radius:12px; overflow:hidden; background:var(--mta-surface); }
.mta-category-header { 
    display:flex; align-items:center; justify-content:space-between; 
    padding:14px 16px; cursor:pointer; transition:background .15s; 
    background:var(--mta-surface);
}
.mta-category-header:hover { background:var(--mta-surface-2); }
.mta-category-header.is-open { background:var(--mta-surface-2); }
.mta-category-header-left { display:flex; align-items:center; gap:10px; }
.mta-category-grade-name { 
    font-size:13px; 
    font-weight:700; 
    color:var(--mta-text); 
    white-space: nowrap;
}
.mta-category-header-right { 
    display:flex; 
    align-items:center; 
    gap:10px; 
    flex-shrink: 0; 
}
.mta-category-bar-wrap { 
    width:60px; 
    height:6px; 
    background:var(--mta-border-soft); 
    border-radius:999px; 
    overflow:hidden; 
    flex-shrink: 0;
}
.mta-category-count { 
    font-size:14px; 
    font-weight:800; 
    min-width:24px; 
    text-align:right; 
    flex-shrink: 0;
}
.mta-category-pct { 
    font-size:11px; 
    font-weight:600; 
    color:var(--mta-text-3); 
    min-width:32px; 
    text-align:right; 
    flex-shrink: 0;
}
.mta-category-chevron { 
    flex-shrink: 0;
}
.mta-category-chevron svg { 
    width:14px; 
    height:14px; 
    color:var(--mta-text-3); 
    transition:transform .2s; 
}
.mta-category-header.is-open .mta-category-chevron { transform:rotate(180deg); }
.mta-category-content { display:none; border-top:1px solid var(--mta-border-soft); }

/* ── Pills (achievement) ────────────────────────────────── */
.mta-pill-hi { display:inline-block; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:700; background:rgba(16,185,129,.12); color:#059669; }
.mta-pill-warn { display:inline-block; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:700; background:rgba(245,158,11,.12); color:#D97706; }
.mta-pill-danger { display:inline-block; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:700; background:rgba(239,68,68,.12); color:#DC2626; }
.mta-pill-info { display:inline-block; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:600; background:var(--mta-surface-2); color:var(--mta-text-3); }

/* ── Grades ─────────────────────────────────────────────── */
.mta-grade {
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-width:24px;
    height:24px;
    padding:0 8px;
    border-radius:6px;
    font-size:11px;
    font-weight:800;
    white-space:nowrap;
}
.mta-grade-a { background:rgba(16,185,129,.15); color:#059669; }
.mta-grade-b { background:rgba(59,130,246,.15); color:#2563EB; }
.mta-grade-c { background:rgba(245,158,11,.15); color:#D97706; }
.mta-grade-d { background:rgba(239,68,68,.15); color:#DC2626; }
.mta-grade-x { background:var(--mta-surface-2); color:var(--mta-text-3); }

/* ── Donut ──────────────────────────────────────────────── */
.mta-donut-wrap-v2 { display:flex; flex-direction:column; align-items:center; gap:16px; padding:20px; }
.mta-donut-ring-wrap { position:relative; width:160px; height:160px; }
.mta-donut-center-text { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.mta-donut-total-label { font-size:10px; font-weight:600; color:var(--mta-text-3); text-transform:uppercase; letter-spacing:.5px; }
.mta-donut-total-value { font-size:28px; font-weight:900; color:var(--mta-text); line-height:1.1; }
.mta-donut-legend-row { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; }
.mta-legend-pill { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:999px; border:1px solid var(--mta-border); background:var(--mta-surface); font-size:12px; font-weight:600; color:var(--mta-text-2); cursor:pointer; transition:all .15s; }
.mta-legend-pill:hover { border-color:var(--mta-border-hover); background:var(--mta-surface-2); }
.mta-legend-pill.is-selected { border-color:var(--mta-primary); background:var(--mta-tint-blue); color:var(--mta-primary); }
.mta-legend-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.mta-legend-hint { width:100%; text-align:center; font-size:10.5px; color:var(--mta-text-3); margin-top:4px; }

/* ── Grade drill-down ───────────────────────────────────── */
.mta-grade-drill { margin:12px 16px 16px; border:1px solid var(--mta-border); border-radius:12px; overflow:hidden; }
.mta-drill-header { display:flex; align-items:center; gap:8px; padding:10px 14px; background:var(--mta-surface-2); border-bottom:1px solid var(--mta-border-soft); }
.mta-drill-label { font-size:13px; font-weight:700; color:var(--mta-text); }
.mta-drill-count { font-size:12px; color:var(--mta-text-3); }
.mta-drill-close { margin-left:auto; width:24px; height:24px; border-radius:6px; border:none; background:transparent; color:var(--mta-text-3); font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
.mta-drill-close:hover { background:var(--mta-surface); color:var(--mta-text); }
.mta-drill-more { padding:8px 14px; font-size:11px; color:var(--mta-text-3); text-align:center; border-top:1px solid var(--mta-border-soft); }

/* ── H-bar (territory) ──────────────────────────────────── */
.mta-hbar-list { display:flex; flex-direction:column; gap:10px; padding:16px; }
.mta-hbar-row { position:relative; }
.mta-hbar-track { position:relative; height:40px; border-radius:10px; overflow:hidden; background:var(--mta-surface-2); }
.mta-hbar-fill { position:absolute; inset:0; transition:width .6s cubic-bezier(.22,1,.36,1); }
.mta-hbar-content { position:relative; display:flex; align-items:center; justify-content:space-between; padding:0 12px; height:100%; z-index:1; }
.mta-hbar-label { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; color:var(--mta-text); }
.mta-hbar-rank { width:22px; height:22px; border-radius:6px; background:var(--mta-surface); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; color:var(--mta-text-2); }

/* ── Status badges ──────────────────────────────────────── */
.mta-status { display:inline-flex; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:700; }
.mta-s-done { background:rgba(16,185,129,.12); color:#059669; }
.mta-s-sched { background:rgba(99,102,241,.12); color:#4F46E5; }
.mta-btn-sm { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:8px; border:1px solid var(--mta-border); background:var(--mta-surface); color:var(--mta-text-2); font-size:11px; font-weight:600; cursor:pointer; }
.mta-btn-sm:hover { background:var(--mta-primary); color:#fff; border-color:var(--mta-primary); }

/* ── Misc ───────────────────────────────────────────────── */
.mta-view-all { padding:12px; text-align:center; font-size:12px; font-weight:600; color:var(--mta-primary); cursor:pointer; }
.mta-view-all:hover { text-decoration:underline; }
.mta-empty-state { padding:40px 20px; text-align:center; color:var(--mta-text-3); }
.mta-empty-state p { font-size:13px; }
.mta-shimmer { background:linear-gradient(90deg,var(--mta-surface-2) 25%,var(--mta-border-soft) 50%,var(--mta-surface-2) 75%); background-size:200% 100%; animation:mta-shimmer 1.5s infinite; }
@keyframes mta-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

.mta-body-tooltip { position:fixed; z-index:9999; padding:6px 12px; background:var(--mta-text); color:var(--mta-surface); font-size:11.5px; font-weight:500; border-radius:8px; pointer-events:none; opacity:0; transform:translateY(4px); transition:all .15s; max-width:260px; line-height:1.4; }
.mta-body-tooltip.is-visible { opacity:1; transform:translateY(0); }

/* ── Modal ──────────────────────────────────────────────── */
.mta-modal { position:fixed; inset:0; z-index:10000; display:flex; align-items:center; justify-content:center; padding:20px; }
.mta-modal-bg { position:absolute; inset:0; background:rgba(0,0,0,.45); backdrop-filter:blur(4px); }
.mta-modal-card { position:relative; background:var(--mta-surface); border-radius:20px; box-shadow:0 25px 50px -12px rgba(0,0,0,.25); max-height:90vh; overflow:hidden; display:flex; flex-direction:column; }
.mta-modal-card {
    width: min(860px, 94vw) !important;
}
.mta-modal-head { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid var(--mta-border-soft); flex-shrink:0; }
.mta-modal-head h3 { font-size:16px; font-weight:800; color:var(--mta-text); }
.mta-modal-body { padding:20px; overflow-y:auto; }
@media (max-width: 600px) {
    .mta-category-header-right {
        gap: 6px;
    }
    .mta-category-bar-wrap {
        display: none;
    }
    .mta-section-title-action {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
}

/* ── Team table special styling ─────────────────────────── */
.mta-table-team tbody tr { position:relative; }
.mta-table-team .mta-emp-expand-btn { 
    transition: all .2s ease;
}
</style>`);
    }
};

