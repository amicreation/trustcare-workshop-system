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
        .social-footer {
            margin-top: 35px;
            border-top: 1px solid #eee;
            padding-top: 10px;
            text-align: center;
            font-size: 9px;
            color: #555;
        }
        .social-footer table {
            width: 100%;
            border-collapse: collapse;
        }
        .social-footer td {
            width: 33.3%;
            text-align: center;
            vertical-align: middle;
            border: none;
            padding: 0;
        }
        .social-footer img {
            vertical-align: middle;
            margin-right: 4px;
            width: 12px;
            height: 12px;
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
                    Contact: {{ $settings['mobile'] ?? '8200695660 | 9512660711' }} | Email: {{ $settings['email'] ?? 'info@trustcare.com' }}
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

    <!-- Social Details Footer -->
    <div class="social-footer">
        <table>
            <tr>
                <td>
                    <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjEyIiBoZWlnaHQ9IjEyIiBmaWxsPSIjNTU1NTU1Ij48cGF0aCBkPSJNMjAgNEg0Yy0xLjEgMC0yIC45LTIgMnYxMmMwIDEuMS45IDIgMiAyaDE2YzEuMSAwIDItLjkgMi0yVjZjMC0xLjEtLjktMi0yLTJ6bTAgNGwtOCA1LTgtNVY2bDggNSA4LTV2MnoiLz48L3N2Zz4=" />
                    <span>TrustcareWorkshop@gmail.com</span>
                </td>
                <td>
                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAABe0lEQVR4nMWVS04CQRCGWXgANd5AXOglWKhrEqiPCSw04srHAQw+lgY3nIJA3HsDvIIewLU8NqArxlRShHEePTAQ7aSSzkz3/838Vd2Vy/3HKJVKe8A18CgiTVfoGlubTxUGtkXkGZgC/pKhe7q1Wm3LJf6eQdgPhmrEQuzLVxJnDunEeT7NKPYFXAAvIbvmObEkpYkNgZ6IvNp8BvgoFAobwHkIfBkEPDmEP0XkpFqt7gDHGjY/BfozCPAdAjSD/reSxD3P2wcezIrZ84mI3Nm7foJ1rVSAfjlw7/i7hoicZQUMzYqJAzCxNaMsgJ557kx+pVI5ssQvB9BNujkNUC6XDzMBFrRovIpFvpXirQNwA9QzV5GWoJViI/QnYxM/EJFBKsB10ERkoKWoVmhONMyWepJ45KAteFWMNJmW0IjnMYBfV0U+62VHfEw9z9sN94PuGgHtSD/QJrGOhgO8FYvFzQggAOms0DLbieLBof4BV4s2fU1oxPO/Gj/YgjwVNpSdjQAAAABJRU5ErkJggg==" />
                    <span>trustcareworkshop</span>
                </td>
                <td>
                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAABjklEQVR4nMWVPUsDQRCGD2Nl4RdoZ629Fn4UqUSFQEj2fTdw6QQJiamtxDMaLBX/gVj6T0QM2Ig/QIweKeyNRBbv5Fxuk73zwIFplpn32Z2Zm3Oc/zaSOSnlBoAGyVbgdSHEuud5Y38RniJ5RtInOTD4G8l2tVqdTCQuhNgh2RsirLsvpdyyEgdQI9lPID4IXOXs2dzcRtwHcA/gUXtp3/iSYrE4bVGWW5KL0TySuzo8tidBQ4eJv5Oci8nTAcrbelAumAgjAMBVGF8oFCYAnJO8IXkXE/v6a4TVnI+qO4CDyIX2Lfq0Fn1B3SKhGYm/sLhQLQo4TQIAcGkR37IBdJwRBuDQBtBMCyB5bShR4ydILS4D4InksvJSqTQfxlcqlYXwnORDXK6UclUf016GPfCVpl7Lk6wAALy4Ws6qDyQDQFetHVPDtgF8pgXgO3dz1FS4JD9SAPpqLzk2FqztlwSAZ+sfTmiu686QPI4swThAl+SRseY2psZNCLFSLpeXwjM14+osn8+PpxbOyr4A3dRpqiWTklsAAAAASUVORK5CYII=" />
                    <span>TrustcareWorkshop@gmail.com</span>
                </td>
            </tr>
        </table>
    </div>
</div>

</body>
</html>
