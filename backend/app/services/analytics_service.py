from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from app.db.models.application import Application, ApplicationStatus
from app.db.models.prediction import ScreeningResult
from app.db.models.course import Course
from app.db.models.user import User

def get_comprehensive_analytics(db: Session, days: Optional[int] = None) -> Dict[str, Any]:
    """Calculate comprehensive analytics for the admin dashboard."""
    
    # Base queries
    apps_query = db.query(Application).options(
        joinedload(Application.course),
        joinedload(Application.screening_result).joinedload(ScreeningResult.reviewer)
    )
    
    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        apps_query = apps_query.filter(Application.created_at >= cutoff)
        
    applications = apps_query.all()
    
    # 1. Application Funnel & Status Distribution
    total_apps = len(applications)
    status_counts = {s.value: 0 for s in ApplicationStatus}
    for app in applications:
        status_counts[app.status.value] += 1
        
    submitted_apps = [a for a in applications if a.status != ApplicationStatus.draft]
    total_submitted = len(submitted_apps)
    
    pipeline = [
        {"label": "Total", "value": total_apps},
        {"label": "Submitted", "value": total_submitted},
        {"label": "Recommended", "value": status_counts.get("recommended", 0)},
        {"label": "Under review", "value": status_counts.get("under_review", 0)},
        {"label": "Accepted", "value": status_counts.get("accepted", 0)},
        {"label": "Rejected", "value": status_counts.get("rejected", 0)},
    ]
    
    # 2. Time-based Trends (Monthly)
    volume_over_time = {}
    draft_vs_submitted = {}
    
    for app in applications:
        month = app.created_at.strftime("%Y-%m")
        volume_over_time[month] = volume_over_time.get(month, 0) + 1
        
        if month not in draft_vs_submitted:
            draft_vs_submitted[month] = {"month": month, "submitted": 0, "draft": 0}
        
        if app.status == ApplicationStatus.draft:
            draft_vs_submitted[month]["draft"] += 1
        else:
            draft_vs_submitted[month]["submitted"] += 1
            
    # Sort trends by month
    sorted_months = sorted(volume_over_time.keys())
    volume_trend = [{"month": m, "count": volume_over_time[m]} for m in sorted_months]
    conversion_trend = [draft_vs_submitted[m] for m in sorted_months]

    # 3. Course-based Analytics
    course_stats = {}
    for app in applications:
        course_name = app.course.name if app.course else f"Course #{app.course_id}"
        if course_name not in course_stats:
            course_stats[course_name] = {
                "name": course_name, 
                "total": 0, 
                "accepted": 0, 
                "rejected": 0, 
                "pending": 0,
                "ai_recommended": 0,
                "ai_total": 0,
                "score_sum": 0
            }
        
        cs = course_stats[course_name]
        cs["total"] += 1
        if app.status == ApplicationStatus.accepted: cs["accepted"] += 1
        elif app.status == ApplicationStatus.rejected: cs["rejected"] += 1
        elif app.status != ApplicationStatus.draft: cs["pending"] += 1
        
        if app.screening_result:
            cs["ai_total"] += 1
            cs["score_sum"] += app.screening_result.prediction_score
            if app.screening_result.decision == "recommended":
                cs["ai_recommended"] += 1

    course_volume = sorted(
        [{"name": k, "total": v["total"]} for k, v in course_stats.items()],
        key=lambda x: x["total"], reverse=True
    )
    
    course_outcomes = sorted(
        [{"name": k, "accepted": v["accepted"], "rejected": v["rejected"], "pending": v["pending"]} 
         for k, v in course_stats.items()],
        key=lambda x: x["accepted"], reverse=True
    )

    # 4. AI Performance
    screened_apps = [a for a in applications if a.screening_result]
    total_screened = len(screened_apps)
    
    ai_decisions = {"recommended": 0, "rejected": 0, "review": 0}
    score_buckets = {
        "0–19": 0, "20–39": 0, "40–59": 0, "60–69": 0, "70–79": 0, "80–89": 0, "90–100": 0
    }
    
    for app in screened_apps:
        sr = app.screening_result
        ai_decisions[sr.decision] = ai_decisions.get(sr.decision, 0) + 1
        
        s = int(sr.prediction_score)
        if s < 20: score_buckets["0–19"] += 1
        elif s < 40: score_buckets["20–39"] += 1
        elif s < 60: score_buckets["40–59"] += 1
        elif s < 70: score_buckets["60–69"] += 1
        elif s < 80: score_buckets["70–79"] += 1
        elif s < 90: score_buckets["80–89"] += 1
        else: score_buckets["90–100"] += 1

    # 5. Admin Review Performance
    reviewed_apps = [a for a in screened_apps if a.screening_result.reviewed_by_admin]
    
    reviewer_workload = {}
    agreement_stats = {"agreed": 0, "ai_rec_admin_rej": 0, "ai_rej_admin_acc": 0}
    
    for app in reviewed_apps:
        sr = app.screening_result
        # Workload
        if sr.reviewer:
            rev_name = sr.reviewer.email.split("@")[0]
            if rev_name not in reviewer_workload:
                reviewer_workload[rev_name] = {"name": rev_name, "accepted": 0, "rejected": 0, "returned": 0}
            
            if sr.final_decision == "accepted": reviewer_workload[rev_name]["accepted"] += 1
            elif sr.final_decision == "rejected": reviewer_workload[rev_name]["rejected"] += 1
            else: reviewer_workload[rev_name]["returned"] += 1
            
        # Agreement
        ai = sr.decision
        adm = sr.final_decision
        if (ai == "recommended" and adm == "accepted") or (ai == "rejected" and adm == "rejected"):
            agreement_stats["agreed"] += 1
        elif ai == "recommended" and adm == "rejected":
            agreement_stats["ai_rec_admin_rej"] += 1
        elif ai == "rejected" and adm == "accepted":
            agreement_stats["ai_rej_admin_acc"] += 1

    return {
        "summary": {
            "total_applications": total_apps,
            "total_submitted": total_submitted,
            "total_screened": total_screened,
            "total_reviewed": len(reviewed_apps),
            "draft_abandonment_rate": round((status_counts["draft"]/total_apps)*100, 2) if total_apps > 0 else 0,
            "final_acceptance_rate": round((status_counts["accepted"]/total_submitted)*100, 2) if total_submitted > 0 else 0,
            "avg_ai_score": round(sum(a.screening_result.prediction_score for a in screened_apps)/total_screened, 2) if total_screened > 0 else 0
        },
        "pipeline": pipeline,
        "status_distribution": [{"name": k.title(), "value": v} for k, v in status_counts.items() if v > 0],
        "trends": {
            "volume": volume_trend,
            "conversion": conversion_trend
        },
        "courses": {
            "volume": course_volume,
            "outcomes": course_outcomes,
            "ai_performance": [
                {
                    "name": v["name"], 
                    "pass_rate": round((v["ai_recommended"]/v["ai_total"])*100, 2) if v["ai_total"] > 0 else 0,
                    "avg_score": round(v["score_sum"]/v["ai_total"], 2) if v["ai_total"] > 0 else 0,
                    "total": v["ai_total"]
                } for v in course_stats.values() if v["ai_total"] > 0
            ]
        },
        "ai_analytics": {
            "decisions": [{"name": k.title(), "value": v} for k, v in ai_decisions.items() if v > 0],
            "score_distribution": [{"range": k, "count": v} for k, v in score_buckets.items()]
        },
        "admin_analytics": {
            "agreement": [
                {"name": "Agreed with AI", "value": agreement_stats["agreed"]},
                {"name": "AI Rec → Admin Rejected", "value": agreement_stats["ai_rec_admin_rej"]},
                {"name": "AI Rej → Admin Accepted", "value": agreement_stats["ai_rej_admin_acc"]},
            ],
            "reviewer_workload": list(reviewer_workload.values())
        }
    }
