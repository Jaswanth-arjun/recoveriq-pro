from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Razorpay
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""

    # LLM
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"
    gemini_api_key: str = ""
    openrouter_api_key: str = ""
    openrouter_model: str = "liquid/lfm-2.5-2.6b:free"
    llm_unavailable: bool = False

    # Voice & Telephony
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_phone: str = ""
    twilio_whatsapp_from: str = ""

    # Messaging
    resend_api_key: str = ""
    whatsapp_token: str = ""
    whatsapp_phone_id: str = ""

    # Google Sign-In (Google Identity Services client id)
    google_client_id: str = ""

    # Infra
    database_url: str = "postgresql+asyncpg://recoveriq:recoveriq@db:5432/recoveriq"
    redis_url: str = "redis://redis:6379/0"
    sentry_dsn: str = ""
    cors_origins: str = "http://localhost:3000,https://portable-debtor-unbridle.ngrok-free.dev"
    frontend_url: str = "https://portable-debtor-unbridle.ngrok-free.dev"
    backend_url: str = "http://localhost:8000"

    class Config:
        env_file = ("../.env", ".env")
        extra = "ignore"

    @staticmethod
    def _is_real(value: str, min_len: int = 12) -> bool:
        # placeholders like "rzp_test_xxxxxxxxxxxx" or "sk-ant-xxxx" are NOT real
        return bool(value) and len(value) >= min_len and "xxxx" not in value.lower()

    @property
    def razorpay_ready(self) -> bool:
        return self._is_real(self.razorpay_key_id) and self._is_real(self.razorpay_key_secret)

    @property
    def anthropic_ready(self) -> bool:
        return self._is_real(self.anthropic_api_key) and not self.llm_unavailable

    @property
    def gemini_ready(self) -> bool:
        return self._is_real(self.gemini_api_key)

    @property
    def openrouter_ready(self) -> bool:
        return self._is_real(self.openrouter_api_key) and not self.llm_unavailable

    @property
    def elevenlabs_ready(self) -> bool:
        return self._is_real(self.elevenlabs_api_key) and self._is_real(self.elevenlabs_voice_id)

    @property
    def twilio_ready(self) -> bool:
        return self._is_real(self.twilio_account_sid, min_len=10) and self._is_real(self.twilio_auth_token, min_len=10) and bool(self.twilio_from_phone)

    @property
    def resend_ready(self) -> bool:
        return self._is_real(self.resend_api_key)

    @property
    def whatsapp_ready(self) -> bool:
        return (self._is_real(self.whatsapp_token) and self._is_real(self.whatsapp_phone_id)) or self.twilio_ready



settings = Settings()
