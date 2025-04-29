let myChart = null;

function formatMoney(amount) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatPercent(value) {
    return new Intl.NumberFormat('es-PE', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value / 100);
}

function calcularIndicadores() {
    // Obtener valores de entrada
    const inversionInicial = parseFloat(document.getElementById('inversion').value);
    const costosOperativos = parseFloat(document.getElementById('costos').value);
    const ventasProyectadas = parseFloat(document.getElementById('ventas').value);
    const periodoAnalisis = parseInt(document.getElementById('periodos').value);
    const tasaDescuentoAnual = parseFloat(document.getElementById('tasa').value);
    const crecimientoMensual = parseFloat(document.getElementById('crecimiento').value) / 100;
    
    // Convertir tasa anual a mensual
    const tasaDescuentoMensual = Math.pow(1 + tasaDescuentoAnual / 100, 1/12) - 1;
    
    // Calcular flujo de caja para cada periodo
    const flujos = [];
    let ventasActuales = ventasProyectadas;
    let flujosNetosTotales = 0;
    let flujoNeto;
    let flujoDescontado;
    let flujoAcumulado = -inversionInicial;
    let breakEvenPeriod = -1;
    
    // Invertimos el signo de la inversión inicial para que el primer flujo sea negativo
    flujos.push({
        periodo: 0,
        ingresos: 0,
        costos: inversionInicial,
        flujoNeto: -inversionInicial,
        flujoDescontado: -inversionInicial,
        flujoAcumulado: -inversionInicial
    });
    
    for (let i = 1; i <= periodoAnalisis; i++) {
        flujoNeto = ventasActuales - costosOperativos;
        flujoDescontado = flujoNeto / Math.pow(1 + tasaDescuentoMensual, i);
        flujoAcumulado += flujoNeto;
        
        flujosNetosTotales += flujoNeto;
        
        flujos.push({
            periodo: i,
            ingresos: ventasActuales,
            costos: costosOperativos,
            flujoNeto: flujoNeto,
            flujoDescontado: flujoDescontado,
            flujoAcumulado: flujoAcumulado
        });
        
        // Incrementar ventas según tasa de crecimiento
        ventasActuales = ventasActuales * (1 + crecimientoMensual);
        
        // Verificar punto de equilibrio (si no se ha encontrado aún)
        if (breakEvenPeriod === -1 && flujoAcumulado >= 0) {
            breakEvenPeriod = i;
        }
    }
    
    // Calcular ROI
    const roi = (flujosNetosTotales - inversionInicial) / inversionInicial * 100;
    
    // Calcular VAN
    let van = -inversionInicial;
    for (let i = 1; i < flujos.length; i++) {
        van += flujos[i].flujoDescontado;
    }
    
    // Calcular TIR (iterativo)
    let tir = calcularTIR(flujos.map(f => f.flujoNeto), 0, 500);
    
    // Mostrar resultados
    document.getElementById('resultados').style.display = 'block';
    
    // Actualizar valores
    const roiElement = document.getElementById('roi-valor');
    roiElement.textContent = formatPercent(roi);
    roiElement.className = 'result-value ' + (roi > 0 ? 'positive' : 'negative');
    
    const vanElement = document.getElementById('van-valor');
    vanElement.textContent = formatMoney(van);
    vanElement.className = 'result-value ' + (van > 0 ? 'positive' : 'negative');
    
    const tirElement = document.getElementById('tir-valor');
    if (tir !== null) {
        const tirAnual = (Math.pow(1 + tir, 12) - 1) * 100;
        tirElement.textContent = formatPercent(tirAnual);
        tirElement.className = 'result-value ' + (tirAnual > tasaDescuentoAnual ? 'positive' : 'negative');
    } else {
        tirElement.textContent = "No calculable";
        tirElement.className = 'result-value neutral';
    }
    
    // Evaluaciones
    document.getElementById('roi-evaluacion').textContent = evaluarROI(roi);
    document.getElementById('van-evaluacion').textContent = evaluarVAN(van);
    document.getElementById('tir-evaluacion').textContent = tir !== null ? evaluarTIR(tir, tasaDescuentoMensual) : "No se puede determinar";
    
    // Interpretación
    const interpretacion = generarInterpretacion(roi, van, tir, tasaDescuentoMensual, tasaDescuentoAnual, breakEvenPeriod);
    document.getElementById('interpretacion-texto').innerHTML = interpretacion;
    
    // Mostrar tabla de flujo de caja
    mostrarTablaFlujo(flujos);
    
    // Mostrar punto de equilibrio
    if (breakEvenPeriod !== -1) {
        document.getElementById('break-even-text').textContent = `El proyecto alcanza el punto de equilibrio en el mes ${breakEvenPeriod}.`;
    } else {
        document.getElementById('break-even-text').textContent = "El proyecto no alcanza el punto de equilibrio en el periodo analizado.";
    }
    
    // Mostrar gráfico
    mostrarGrafico(flujos);
}

function calcularTIR(flujos, min, max) {
    const EPSILON = 0.0001;
    let tasaInferior = 0;
    let tasaSuperior = 1;
    
    // Verificar si hay cambio de signo en los flujos (condición para que exista TIR)
    let tieneSignoPositivo = false;
    let tieneSignoNegativo = false;
    
    for (let flujo of flujos) {
        if (flujo > 0) tieneSignoPositivo = true;
        if (flujo < 0) tieneSignoNegativo = true;
    }
    
    if (!tieneSignoPositivo || !tieneSignoNegativo) {
        return null; // No hay TIR calculable
    }
    
    // Método iterativo de bisección para calcular TIR
    let intentos = 0;
    let tir = 0;
    
    while (intentos < 100) {
        tir = (tasaInferior + tasaSuperior) / 2;
        
        let van = 0;
        for (let i = 0; i < flujos.length; i++) {
            van += flujos[i] / Math.pow(1 + tir, i);
        }
        
        if (Math.abs(van) < EPSILON) {
            return tir;
        }
        
        if (van > 0) {
            tasaInferior = tir;
        } else {
            tasaSuperior = tir;
        }
        
        intentos++;
    }
    
    return tir; // Aproximación después de 100 intentos
}

function evaluarROI(roi) {
    if (roi > 50) return "Excelente";
    if (roi > 25) return "Muy bueno";
    if (roi > 10) return "Bueno";
    if (roi > 0) return "Aceptable";
    return "No rentable";
}

function evaluarVAN(van) {
    if (van > 0) return "Proyecto viable";
    return "Proyecto no viable";
}

function evaluarTIR(tir, tasaDescuento) {
    const tirAnual = Math.pow(1 + tir, 12) - 1;
    const tasaAnual = Math.pow(1 + tasaDescuento, 12) - 1;
    
    if (tirAnual > tasaAnual * 2) return "Excelente";
    if (tirAnual > tasaAnual * 1.5) return "Muy bueno";
    if (tirAnual > tasaAnual) return "Bueno";
    return "Inferior a la tasa requerida";
}

function generarInterpretacion(roi, van, tir, tasaDescuentoMensual, tasaDescuentoAnual, breakEvenPeriod) {
    let html = "<p><strong>Análisis del proyecto:</strong></p>";
    
    // Interpretación del ROI
    html += "<p><strong>ROI (Retorno sobre la Inversión):</strong> ";
    if (roi > 50) {
        html += `El ROI de ${formatPercent(roi)} es excelente, indica que se recupera la inversión y se obtiene un beneficio del ${formatPercent(roi)} sobre el capital invertido.`;
    } else if (roi > 25) {
        html += `El ROI de ${formatPercent(roi)} es muy bueno, muestra un retorno significativo sobre la inversión inicial.`;
    } else if (roi > 10) {
        html += `El ROI de ${formatPercent(roi)} es bueno, representa un rendimiento positivo sobre la inversión.`;
    } else if (roi > 0) {
        html += `El ROI de ${formatPercent(roi)} es aceptable pero modesto, indica que se recupera la inversión con un pequeño beneficio.`;
    } else {
        html += `El ROI negativo de ${formatPercent(roi)} indica que el proyecto no recupera la inversión inicial en el período analizado.`;
    }
    html += "</p>";
    
    // Interpretación del VAN
    html += "<p><strong>VAN (Valor Actual Neto):</strong> ";
    if (van > 0) {
        html += `El VAN positivo de ${formatMoney(van)} indica que el proyecto genera valor y supera la rentabilidad exigida. El proyecto es viable financieramente.`;
    } else if (van === 0) {
        html += `El VAN de ${formatMoney(van)} indica que el proyecto apenas cumple con la rentabilidad exigida.`;
    } else {
        html += `El VAN negativo de ${formatMoney(van)} indica que el proyecto no alcanza la rentabilidad mínima exigida. No es recomendable realizar esta inversión.`;
    }
    html += "</p>";
    
    // Interpretación del TIR
    if (tir !== null) {
        const tirAnual = (Math.pow(1 + tir, 12) - 1) * 100;
        html += "<p><strong>TIR (Tasa Interna de Retorno):</strong> ";
        if (tirAnual > tasaDescuentoAnual) {
            html += `La TIR de ${formatPercent(tirAnual)} es superior a la tasa de descuento (${formatPercent(tasaDescuentoAnual)}), lo que confirma la viabilidad del proyecto. `;
            if (tirAnual > tasaDescuentoAnual * 2) {
                html += "El proyecto presenta una rentabilidad excepcional.";
            } else if (tirAnual > tasaDescuentoAnual * 1.5) {
                html += "El proyecto presenta una rentabilidad muy atractiva.";
            } else {
                html += "El proyecto presenta una rentabilidad aceptable.";
            }
        } else {
            html += `La TIR de ${formatPercent(tirAnual)} es inferior a la tasa de descuento (${formatPercent(tasaDescuentoAnual)}), lo que indica que existen alternativas de inversión más rentables.`;
        }
        html += "</p>";
    } else {
        html += "<p><strong>TIR (Tasa Interna de Retorno):</strong> No se puede calcular una TIR para este proyecto debido a la estructura de los flujos de caja.</p>";
    }
    
    // Interpretación del punto de equilibrio
    html += "<p><strong>Punto de Equilibrio:</strong> ";
    if (breakEvenPeriod !== -1) {
        html += `El proyecto recupera la inversión inicial en el mes ${breakEvenPeriod}, lo que `;
        if (breakEvenPeriod <= 12) {
            html += "es muy favorable y sugiere un período de recuperación rápido.";
        } else if (breakEvenPeriod <= 24) {
            html += "representa un período de recuperación razonable.";
        } else {
            html += "indica un período de recuperación prolongado.";
        }
    } else {
        html += "El proyecto no alcanza el punto de equilibrio dentro del período analizado, lo que representa un riesgo significativo.";
    }
    html += "</p>";
    
    // Conclusión general
    html += "<p><strong>Conclusión:</strong> ";
    if (van > 0 && (tir === null || (tir !== null && Math.pow(1 + tir, 12) - 1 > tasaDescuentoAnual / 100))) {
        if (roi > 25 && (breakEvenPeriod !== -1 && breakEvenPeriod <= 18)) {
            html += "El proyecto es altamente recomendable. Presenta buenos indicadores financieros y un período de recuperación razonable.";
        } else if (roi > 0 && (breakEvenPeriod !== -1)) {
            html += "El proyecto es viable pero con rentabilidad moderada. Se recomienda analizar alternativas para mejorar su desempeño.";
        } else {
            html += "El proyecto es técnicamente viable pero presenta aspectos que requieren atención, como un largo período de recuperación o baja rentabilidad.";
        }
    } else {
        html += "El proyecto no cumple con los criterios mínimos de viabilidad financiera. No se recomienda su implementación sin realizar modificaciones sustanciales.";
    }
    html += "</p>";
    
    return html;
}

function mostrarTablaFlujo(flujos) {
    const tbody = document.getElementById('tabla-flujo-body');
    tbody.innerHTML = '';
    
    for (const flujo of flujos) {
        const row = document.createElement('tr');
        
        // Periodo
        const cellPeriodo = document.createElement('td');
        cellPeriodo.textContent = flujo.periodo;
        row.appendChild(cellPeriodo);
        
        // Ingresos
        const cellIngresos = document.createElement('td');
        cellIngresos.textContent = formatMoney(flujo.ingresos);
        row.appendChild(cellIngresos);
        
        // Costos
        const cellCostos = document.createElement('td');
        cellCostos.textContent = formatMoney(flujo.costos);
        row.appendChild(cellCostos);
        
        // Flujo Neto
        const cellFlujoNeto = document.createElement('td');
        cellFlujoNeto.textContent = formatMoney(flujo.flujoNeto);
        cellFlujoNeto.style.color = flujo.flujoNeto >= 0 ? '#27ae60' : '#e74c3c';
        row.appendChild(cellFlujoNeto);
        
        // Flujo Descontado
        const cellFlujoDescontado = document.createElement('td');
        cellFlujoDescontado.textContent = formatMoney(flujo.flujoDescontado);
        row.appendChild(cellFlujoDescontado);
        
        // Flujo Acumulado
        const cellFlujoAcumulado = document.createElement('td');
        cellFlujoAcumulado.textContent = formatMoney(flujo.flujoAcumulado);
        cellFlujoAcumulado.style.color = flujo.flujoAcumulado >= 0 ? '#27ae60' : '#e74c3c';
        row.appendChild(cellFlujoAcumulado);
        
        tbody.appendChild(row);
    }
}

function mostrarGrafico(flujos) {
    const ctx = document.getElementById('flujoChart').getContext('2d');
    
    // Destruir gráfico anterior si existe
    if (myChart) {
        myChart.destroy();
    }
    
    // Preparar datos para el gráfico
    const labels = flujos.map(f => `Mes ${f.periodo}`);
    const dataNeto = flujos.map(f => f.flujoNeto);
    const dataAcumulado = flujos.map(f => f.flujoAcumulado);
    
    // Crear nuevo gráfico
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Flujo Neto',
                    data: dataNeto,
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 2,
                    tension: 0.1
                },
                {
                    label: 'Flujo Acumulado',
                    data: dataAcumulado,
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 2,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatMoney(context.raw);
                        }
                    }
                }
            }
        }
    });
}

// Iniciar cálculos automáticamente al cargar
window.onload = function() {
    calcularIndicadores();
}; 