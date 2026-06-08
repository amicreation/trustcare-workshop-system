<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Inspection Sheet - Job Card {{ $jobCard->job_card_no }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #111;
            font-size: 11px;
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
        .title {
            font-size: 18px;
            font-weight: bold;
            color: #d71920;
            margin: 0;
            text-transform: uppercase;
        }
        .subtitle {
            font-size: 10px;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 2px;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #ddd;
            margin-bottom: 15px;
        }
        .meta-table td {
            border: 1px solid #ddd;
            padding: 5px 8px;
            vertical-align: top;
        }
        .field-label {
            font-weight: bold;
            font-size: 9px;
            color: #555;
            text-transform: uppercase;
        }
        .status-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .status-table th {
            background-color: #111;
            color: #fff;
            font-size: 10px;
            font-weight: bold;
            padding: 6px 8px;
            text-align: left;
            text-transform: uppercase;
        }
        .status-table td {
            border: 1px solid #ddd;
            padding: 6px 8px;
            font-size: 10px;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 6px;
            font-size: 9px;
            font-weight: bold;
            border-radius: 3px;
            text-transform: uppercase;
            text-align: center;
        }
        .status-good {
            background-color: #d1e7dd;
            color: #0f5132;
        }
        .status-attention {
            background-color: #fff3cd;
            color: #664d03;
        }
        .status-critical {
            background-color: #f8d7da;
            color: #842029;
        }
        .photos-container {
            margin-top: 25px;
        }
        .photo-card {
            display: inline-block;
            width: 48%;
            margin-right: 2%;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 5px;
            box-sizing: border-box;
            vertical-align: top;
        }
        .photo-card img {
            width: 100%;
            height: 150px;
            object-fit: cover;
            border-radius: 2px;
        }
        .photo-desc {
            font-size: 9px;
            color: #555;
            margin-top: 4px;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
        }
    </style>
</head>
<body>

<div class="container">
    <table class="header-table" style="width: 100%; border-bottom: 2px solid #d71920; padding-bottom: 10px; margin-bottom: 15px;">
        <tr>
            <td style="width: 15%; vertical-align: middle;">
                @if(!empty($logo_data))
                    <img src="{{ $logo_data }}" style="max-height: 45px; display: block;" />
                @endif
            </td>
            <td style="width: 50%; vertical-align: middle; padding-left: 10px;">
                <div class="title" style="font-size: 18px; font-weight: bold; color: #d71920; margin: 0; text-transform: uppercase;">TRUST CARE WORKSHOP</div>
                <div class="subtitle" style="font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">Vehicle Inspection Sheet</div>
            </td>
            <td style="width: 35%; text-align: right; font-weight: bold; font-size: 11px; vertical-align: middle;">
                Job Card No: {{ $jobCard->job_card_no }}<br>
                Date: {{ $jobCard->date }}
            </td>
        </tr>
    </table>

    <table class="meta-table">
        <tr>
            <td style="width: 50%;">
                <span class="field-label">Customer Name:</span> {{ $customer->name }}<br>
                <span class="field-label">Contact:</span> {{ $customer->mobile }}
            </td>
            <td style="width: 50%;">
                <span class="field-label">Vehicle Reg No:</span> <strong style="color: #d71920;">{{ $vehicle->registration_no }}</strong><br>
                <span class="field-label">Make & Model:</span> {{ $vehicle->make }} {{ $vehicle->model }}
            </td>
        </tr>
        <tr>
            <td>
                <span class="field-label">Odometer:</span> {{ $inspection->odometer }} KMS
            </td>
            <td>
                <span class="field-label">Fuel Level:</span> {{ $inspection->fuel_level }}
            </td>
        </tr>
    </table>

    <table class="status-table">
        <thead>
            <tr>
                <th style="width: 50%;">Inspection Category</th>
                <th style="width: 50%;">Status</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Exterior Body Condition</td>
                <td>
                    <span class="status-badge {{ $inspection->exterior_status === 'Good' ? 'status-good' : ($inspection->exterior_status === 'Critical' ? 'status-critical' : 'status-attention') }}">
                        {{ $inspection->exterior_status }}
                    </span>
                </td>
            </tr>
            <tr>
                <td>Interior Condition & Trim</td>
                <td>
                    <span class="status-badge {{ $inspection->interior_status === 'Good' ? 'status-good' : ($inspection->interior_status === 'Critical' ? 'status-critical' : 'status-attention') }}">
                        {{ $inspection->interior_status }}
                    </span>
                </td>
            </tr>
            <tr>
                <td>Tyres Status</td>
                <td>
                    <span class="status-badge {{ $inspection->tyres_status === 'Good' ? 'status-good' : ($inspection->tyres_status === 'Critical' ? 'status-critical' : 'status-attention') }}">
                        {{ $inspection->tyres_status }}
                    </span>
                </td>
            </tr>
            <tr>
                <td>Battery Charge & Terminals</td>
                <td>
                    <span class="status-badge {{ $inspection->battery_status === 'Good' ? 'status-good' : ($inspection->battery_status === 'Critical' ? 'status-critical' : 'status-attention') }}">
                        {{ $inspection->battery_status }}
                    </span>
                </td>
            </tr>
            <tr>
                <td>Lights & Electrical Signals</td>
                <td>
                    <span class="status-badge {{ $inspection->lights_status === 'Good' ? 'status-good' : ($inspection->lights_status === 'Critical' ? 'status-critical' : 'status-attention') }}">
                        {{ $inspection->lights_status }}
                    </span>
                </td>
            </tr>
            <tr>
                <td>Brakes Wear & Level</td>
                <td>
                    <span class="status-badge {{ $inspection->brakes_status === 'Good' ? 'status-good' : ($inspection->brakes_status === 'Critical' ? 'status-critical' : 'status-attention') }}">
                        {{ $inspection->brakes_status }}
                    </span>
                </td>
            </tr>
            <tr>
                <td>Suspension & Steering</td>
                <td>
                    <span class="status-badge {{ $inspection->suspension_status === 'Good' ? 'status-good' : ($inspection->suspension_status === 'Critical' ? 'status-critical' : 'status-attention') }}">
                        {{ $inspection->suspension_status }}
                    </span>
                </td>
            </tr>
            <tr>
                <td>Engine Sound & Fluids</td>
                <td>
                    <span class="status-badge {{ $inspection->engine_status === 'Good' ? 'status-good' : ($inspection->engine_status === 'Critical' ? 'status-critical' : 'status-attention') }}">
                        {{ $inspection->engine_status }}
                    </span>
                </td>
            </tr>
        </tbody>
    </table>

    @if($inspection->notes)
        <div style="margin-top: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background-color: #f8f9fa;">
            <strong>Inspection Notes / Observations:</strong><br>
            {{ $inspection->notes }}
        </div>
    @endif

    @if(count($photos) > 0)
        <div class="photos-container">
            <h3 style="border-bottom: 1.5px solid #d71920; padding-bottom: 4px; margin-bottom: 12px; font-size: 11px; text-transform: uppercase;">Uploaded Condition Photos</h3>
            <div>
                @foreach($photos as $photo)
                    <div class="photo-card">
                        <!-- Convert public paths to absolute local paths for DomPDF rendering -->
                        <img src="{{ public_path(str_replace('/storage/', 'storage/', $photo->photo_path)) }}" alt="Photo">
                        <div class="photo-desc">{{ $photo->view_type }} View @if($photo->description) - {{ $photo->description }} @endif</div>
                    </div>
                @endforeach
            </div>
        </div>
    @endif
</div>

</body>
</html>
