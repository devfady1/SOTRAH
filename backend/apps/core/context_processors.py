from django.conf import settings


def gtm(request):
    """
    سياق عام يمرر معرّف Google Tag Manager (GTM_ID)
    لكافة قوالب HTML تلقائياً وبأمان لمنع الأخطاء البرمجية.
    """
    return {
        'GTM_ID': getattr(settings, 'GTM_ID', None)
    }
