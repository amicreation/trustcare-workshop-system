<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_no }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            color: #111;
            font-size: 10px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            padding: 10px;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #d71920;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .workshop-name {
            font-size: 20px;
            font-weight: bold;
            color: #d71920;
            margin: 0;
            text-transform: uppercase;
        }
        .workshop-tagline {
            font-size: 9px;
            font-weight: bold;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 2px;
        }
        .workshop-details {
            font-size: 10px;
            color: #444;
            margin-top: 5px;
        }
        .invoice-title {
            font-size: 18px;
            font-weight: 900;
            color: #d71920;
            text-align: right;
            margin: 0;
        }
        .invoice-no {
            font-size: 11px;
            font-weight: bold;
            color: #111;
            text-align: right;
            margin-top: 3px;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #111;
            margin-bottom: 15px;
        }
        .meta-table td {
            border: 1px solid #111;
            padding: 5px 8px;
            vertical-align: top;
        }
        .field-label {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            color: #000;
        }
        .services-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #111;
            margin-top: 10px;
        }
        .services-table th {
            background-color: #111;
            color: #fff;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
            padding: 6px 8px;
            text-align: left;
            border: 1px solid #111;
        }
        .services-table td {
            border: 1px solid #111;
            padding: 5px 8px;
            font-size: 10px;
            color: #000;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .summary-table {
            width: 250px;
            margin-left: auto;
            margin-top: 15px;
            border-collapse: collapse;
        }
        .summary-table td {
            padding: 4px 8px;
            font-size: 10px;
            border-bottom: 1px solid #ddd;
        }
        .summary-table .grand-total {
            font-size: 12px;
            font-weight: bold;
            color: #d71920;
            border-bottom: none;
            padding-top: 8px;
        }
        .footer-terms {
            margin-top: 35px;
            font-size: 9px;
            color: #555;
            line-height: 1.3;
            border-top: 1px solid #eee;
            padding-top: 5px;
        }
        .signature-table {
            width: 100%;
            margin-top: 50px;
        }
        .signature-line {
            width: 180px;
            border-top: 1px solid #333;
            text-align: center;
            font-size: 9px;
            font-weight: bold;
            color: #555;
            padding-top: 4px;
        }
    </style>
</head>
<body>

<div class="container">
    <!-- Header -->
    <table class="header-table" style="border-bottom: 2px solid #d71920; padding-bottom: 10px; margin-bottom: 15px;">
        <tr>
            <td style="width: 18%; vertical-align: middle;">
                @if(!empty($logo_data))
                    <img src="{{ $logo_data }}" style="max-height: 55px; display: block;" />
                @endif
            </td>
            <td style="width: 47%; vertical-align: middle; padding-left: 10px;">
                <div class="workshop-name">{{ $settings['workshop_name'] ?? 'TRUST CARE WORKSHOP' }}</div>
                <div class="workshop-tagline">{{ $settings['tagline'] ?? 'Driven by Trust, Powered by Skill' }}</div>
                <div class="workshop-details">
                    {{ $settings['address'] ?? 'Near Vaishnodevi Circle, Ahmedabad' }}<br>
                    Contact: {{ $settings['mobile'] ?? '8200695660 | 9512660711' }} | Email: {{ $settings['email'] ?? 'info@trustcare.com' }}<br>
                    <strong>GSTIN:</strong> {{ $settings['gst'] ?? '24AAAAT0000A1Z1' }}
                </div>
            </td>
            <td style="width: 35%; text-align: right; vertical-align: middle;">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-no">NO: {{ $invoice->invoice_no }}</div>
            </td>
        </tr>
    </table>

    <!-- Metadata Details Grid -->
    <table class="meta-table">
        <tr>
            <td style="width: 60%;">
                <span class="field-label">Name:</span> {{ ucwords(strtolower($customer->name)) }}<br>
                <span class="field-label">Contact:</span> {{ $customer->mobile }} @if($customer->alternate_mobile) / {{ $customer->alternate_mobile }} @endif<br>
                <span class="field-label">Email:</span> {{ $customer->email ?? 'N/A' }}<br>
                <span class="field-label">Address:</span> {{ $customer->address_1 }} {{ $customer->address_2 }}
            </td>
            <td style="width: 40%;">
                <span class="field-label">Inward Date:</span> {{ $invoice->inward_date ?? $invoice->date }}<br>
                <span class="field-label">Invoice Date:</span> {{ $invoice->date }}<br>
                <span class="field-label">Residence:</span> {{ $invoice->residence ?? 'N/A' }}<br>
                <span class="field-label">Service Type:</span> {{ $invoice->service_type }}
            </td>
        </tr>
        <tr>
            <td colspan="2" style="background-color: #f8f9fa; font-weight: bold; border-top: 1.5px solid #111; border-bottom: 1.5px solid #111; padding: 4px 8px; font-size: 9px; text-transform: uppercase;">
                Vehicle Information
            </td>
        </tr>
        <tr>
            <td>
                <span class="field-label">Registration No:</span> <strong style="color: #d71920;">{{ $vehicle->registration_no }}</strong><br>
                <span class="field-label">Make & Model:</span> {{ $vehicle->make }} {{ $vehicle->model }}
            </td>
            <td>
                <span class="field-label">Odometer:</span> {{ $invoice->km_reading }} KMS<br>
                <span class="field-label">Chassis No:</span> {{ $vehicle->chassis_no ?? 'N/A' }}<br>
                <span class="field-label">Engine No:</span> {{ $vehicle->engine_no ?? 'N/A' }}
            </td>
        </tr>
    </table>

    <!-- Services & Parts Table -->
    <table class="services-table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 10%;">Type</th>
                <th style="width: 45%;">Description</th>
                <th style="width: 10%; text-align: center;">Qty</th>
                <th style="width: 15%; text-align: right;">Rate</th>
                <th style="width: 15%; text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $index => $item)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $item->type }}</td>
                    <td>{{ $item->description }}</td>
                    <td class="text-center">{{ $item->qty }}</td>
                    <td class="text-right">₹{{ number_format($item->rate, 2) }}</td>
                    <td class="text-right">₹{{ number_format($item->qty * $item->rate, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Totals Table -->
    <table class="summary-table">
        <tr>
            <td style="font-weight: bold;">Parts Total:</td>
            <td class="text-right font-mono">₹{{ number_format($invoice->parts_total, 2) }}</td>
        </tr>
        <tr>
            <td style="font-weight: bold;">Labour Total:</td>
            <td class="text-right font-mono">₹{{ number_format($invoice->labour_total, 2) }}</td>
        </tr>
        <tr>
            <td style="font-weight: bold;">GST Total:</td>
            <td class="text-right font-mono">₹{{ number_format($invoice->gst_total, 2) }}</td>
        </tr>
        @if($invoice->discount > 0)
        <tr>
            <td style="font-weight: bold; color: #d71920;">Discount:</td>
            <td class="text-right font-mono" style="color: #d71920;">-₹{{ number_format($invoice->discount, 2) }}</td>
        </tr>
        @endif
        <tr class="grand-total">
            <td style="font-weight: bold; font-size: 11px;">Grand Total:</td>
            <td class="text-right" style="font-size: 11px;"><strong>₹{{ number_format($invoice->grand_total, 2) }}</strong></td>
        </tr>
    </table>

    <!-- Terms and Conditions -->
    <div class="footer-terms">
        <strong>Terms & Conditions:</strong><br>
        {{ $settings['terms'] ?? 'Payment required upon vehicle collection. Parts warranty subject to manufacturer terms. Labour warranty applicable only to covered repairs.' }}
    </div>

    <!-- Signatures -->
    <table class="signature-table">
        <tr>
            <td style="width: 50%;">
                <div class="signature-line" style="margin-right: auto;">Customer Signature</div>
            </td>
            <td style="width: 50%; text-align: right;">
                <div class="signature-line" style="margin-left: auto;">Authorized Signature</div>
            </td>
        </tr>
    </table>
</div>

</body>
</html>
