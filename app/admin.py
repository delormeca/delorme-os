from passlib.context import CryptContext
from sqladmin import Admin, ModelView, BaseView, expose
from sqladmin.authentication import AuthenticationBackend
from sqlalchemy import select, func
from starlette.requests import Request

from app.config import SECRET_KEY
from app.db import AsyncSessionLocal, async_engine
from app.models import User, Purchase, Subscription, SubscriptionStatus


class AdminAuth(AuthenticationBackend):
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return self.pwd_context.hash(password)

    async def login(self, request: Request) -> bool:
        form = await request.form()
        email = form.get("username")
        password = form.get("password")

        async with AsyncSessionLocal() as db_session:
            stmt = select(User).where(User.email == email)
            result = await db_session.execute(stmt)
            user = result.scalar_one_or_none()

            if (
                user
                and user.is_superuser
                and user.password_hash
                and self.verify_password(password, user.password_hash)
            ):
                request.session.update({"token": user.email})
                return True

        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        return token is not None


class UserAdmin(ModelView, model=User):
    name = "User"
    icon = "fa-solid fa-users"
    
    column_list = [
        User.id,
        User.email,
        User.full_name,
        User.account_type,
        User.stripe_customer_id,
        User.verified,
        User.is_superuser,
        User.created_at,
        User.last_login,
    ]
    column_searchable_list = ["email", "full_name", "stripe_customer_id"]
    column_sortable_list = [User.created_at, User.last_login, User.account_type]
    column_filters = [User.account_type, User.verified, User.is_superuser]
    column_details_exclude_list = ["password_hash"]
    
    column_labels = {
        User.stripe_customer_id: "Stripe Customer",
        User.account_type: "Plan",
        User.is_superuser: "Admin",
    }


class PurchaseAdmin(ModelView, model=Purchase):
    name = "Purchase"
    icon = "fa-solid fa-shopping-cart"
    
    column_list = [
        Purchase.id,
        Purchase.user_id,
        Purchase.product_type,
        Purchase.amount,
        Purchase.currency,
        Purchase.is_successful,
        Purchase.purchase_date,
        Purchase.transaction_id,
    ]
    column_searchable_list = ["transaction_id", "product_type"]
    column_sortable_list = [Purchase.purchase_date, Purchase.amount]
    column_filters = [Purchase.product_type, Purchase.is_successful, Purchase.currency]
    
    column_labels = {
        Purchase.product_type: "Product",
        Purchase.is_successful: "Successful",
        Purchase.transaction_id: "Stripe Transaction",
    }


class SubscriptionAdmin(ModelView, model=Subscription):
    name = "Subscription"
    icon = "fa-solid fa-credit-card"
    
    column_list = [
        Subscription.id,
        Subscription.user_id,
        Subscription.plan,
        Subscription.status,
        Subscription.start_date,
        Subscription.end_date,
        Subscription.stripe_subscription_id,
    ]
    column_searchable_list = ["stripe_subscription_id", "plan"]
    column_sortable_list = [Subscription.start_date, Subscription.end_date]
    column_filters = [Subscription.plan, Subscription.status]
    
    column_labels = {
        Subscription.stripe_subscription_id: "Stripe Subscription",
    }


class PaymentAnalyticsView(BaseView):
    name = "Payment Analytics"
    icon = "fa-solid fa-chart-line"

    @expose("/payment-analytics", methods=["GET"])
    async def payment_analytics_page(self, request: Request):
        """
        Display comprehensive payment analytics dashboard.
        
        Provides metrics on revenue, transactions, subscriptions, and recent activity.
        Integrates seamlessly with SQLAdmin's layout and styling.
        """
        async with AsyncSessionLocal() as session:
            # Revenue metrics
            total_revenue_result = await session.execute(
                select(func.sum(Purchase.amount)).where(Purchase.is_successful)
            )
            total_revenue = total_revenue_result.scalar() or 0

            # Transaction counts
            total_transactions_result = await session.execute(
                select(func.count(Purchase.id)).where(Purchase.is_successful)
            )
            total_transactions = total_transactions_result.scalar() or 0

            # Active subscriptions
            active_subs_result = await session.execute(
                select(func.count(Subscription.id)).where(
                    Subscription.status == SubscriptionStatus.ACTIVE
                )
            )
            active_subscriptions = active_subs_result.scalar() or 0

            # Recent transactions (last 10)
            recent_transactions = await session.execute(
                select(Purchase, User.email, User.full_name)
                .join(User, Purchase.user_id == User.id)
                .where(Purchase.is_successful)
                .order_by(Purchase.purchase_date.desc())
                .limit(10)
            )
            recent_data = recent_transactions.fetchall()

            analytics_data = {
                "total_revenue": total_revenue,
                "total_transactions": total_transactions,
                "active_subscriptions": active_subscriptions,
                "recent_transactions": [
                    {
                        "customer": row.full_name or row.email,
                        "product": row.Purchase.product_type,
                        "amount": float(row.Purchase.amount),
                        "date": row.Purchase.purchase_date.strftime("%Y-%m-%d %H:%M"),
                    }
                    for row in recent_data
                ],
            }

        # Use SQLAdmin's template system
        return await self.templates.TemplateResponse(
            request,
            "payment_analytics.html",
            context={"title": "Payment Analytics", "analytics_data": analytics_data},
        )


class UserInsightsView(BaseView):
    name = "User Insights"
    icon = "fa-solid fa-users"

    @expose("/user-insights", methods=["GET"])
    async def user_insights_page(self, request: Request):
        """
        Display comprehensive user insights dashboard.
        
        Provides metrics on user growth, account distribution, conversion rates,
        and top customers with interactive charts and data tables.
        """
        async with AsyncSessionLocal() as session:
            # User growth metrics
            total_users = await session.execute(select(func.count(User.id)))
            total_users_count = total_users.scalar() or 0

            # Users by account type
            account_types = await session.execute(
                select(User.account_type, func.count(User.id)).group_by(
                    User.account_type
                )
            )
            account_data = account_types.fetchall()

            # Get actual paying customers count (all users with successful purchases)
            paying_customers_result = await session.execute(
                select(func.count(func.distinct(User.id)))
                .join(Purchase, User.id == Purchase.user_id)
                .where(Purchase.is_successful, Purchase.amount > 0)
            )
            paying_customers = paying_customers_result.scalar() or 0
            
            # Top spending users (for display purposes)
            top_spenders_result = await session.execute(
                select(
                    User.full_name,
                    User.email,
                    func.coalesce(func.sum(Purchase.amount), 0).label("total_spent"),
                    func.count(Purchase.id).label("purchase_count")
                )
                .outerjoin(Purchase, (User.id == Purchase.user_id) & Purchase.is_successful)
                .group_by(User.id, User.full_name, User.email)
                .order_by(func.coalesce(func.sum(Purchase.amount), 0).desc())
                .limit(10)
            )
            top_spender_data = top_spenders_result.fetchall()
            
            insights_data = {
                "total_users": total_users_count,
                "account_distribution": [
                    {"type": row[0].name, "count": row[1]} for row in account_data
                ],
                "top_spenders": [
                    {
                        "name": row[0] or "N/A",
                        "email": row[1],
                        "total_spent": float(row[2] or 0),
                        "purchases": row[3],
                    }
                    for row in top_spender_data
                ],
            }
            premium_users = sum(
                item["count"]
                for item in insights_data["account_distribution"]
                if item["type"].lower() == "premium"
            )

        # Use SQLAdmin's template system
        return await self.templates.TemplateResponse(
            request,
            "user_insights.html",
            context={
                "title": "User Insights",
                "insights_data": insights_data,
                "paying_customers": paying_customers,
                "premium_users": premium_users,
            },
        )


def create_admin(app):
    """
    Initialize and configure SQLAdmin with all views and authentication.
    
    Sets up:
    - Secure authentication backend with bcrypt
    - Model views for core entities (Users, Purchases, Subscriptions, etc.)
    - Custom analytics views for business intelligence
    - Custom template directory
    
    Args:
        app: FastAPI application instance
        
    Returns:
        Admin: Configured SQLAdmin instance
    """
    authentication_backend = AdminAuth(secret_key=SECRET_KEY)
    admin = Admin(
        app=app,
        engine=async_engine,
        session_maker=AsyncSessionLocal,
        authentication_backend=authentication_backend,
        templates_dir="app/templates",
    )
    
    # Core model management views
    admin.add_view(UserAdmin)
    admin.add_view(PurchaseAdmin)
    admin.add_view(SubscriptionAdmin)
    
    # Business intelligence dashboards
    admin.add_view(PaymentAnalyticsView)
    admin.add_view(UserInsightsView)

    return admin
