let costosChart = null;
let costosBarrasChart = null;

function formatMoney(amount) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function agregarFila(tipo) {
    const tbody = document.querySelector(`#tabla-${tipo} tbody`);
    const tr = document.createElement('tr');
    
    // Celda de descripción
    const tdDescripcion = document.createElement('td');
    const inputDescripcion = document.createElement('input');
    inputDescripcion.type = 'text';
    inputDescripcion.className = 'form-control';
    inputDescripcion.placeholder = 'Descripción del costo';
    inputDescripcion.required = true;
    inputDescripcion.onchange = () => actualizarTotales();
    tdDescripcion.appendChild(inputDescripcion);
    
    // Celda de monto
    const tdMonto = document.createElement('td');
    const inputMonto = document.createElement('input');
    inputMonto.type = 'number';
    inputMonto.className = 'form-control';
    inputMonto.min = '0';
    inputMonto.step = '0.01';
    inputMonto.placeholder = '0.00';
    inputMonto.required = true;
    inputMonto.onchange = () => actualizarTotales();
    tdMonto.appendChild(inputMonto);
    
    // Celda de frecuencia
    const tdFrecuencia = document.createElement('td');
    const selectFrecuencia = document.createElement('select');
    selectFrecuencia.className = 'form-control';
    selectFrecuencia.required = true;
    ['Diario', 'Semanal', 'Quincenal', 'Mensual', 'Trimestral', 'Semestral', 'Anual'].forEach(freq => {
        const option = document.createElement('option');
        option.value = freq;
        option.textContent = freq;
        selectFrecuencia.appendChild(option);
    });
    selectFrecuencia.onchange = () => actualizarTotales();
    tdFrecuencia.appendChild(selectFrecuencia);
    
    // Celda de departamento
    const tdDepartamento = document.createElement('td');
    const selectDepartamento = document.createElement('select');
    selectDepartamento.className = 'form-control';
    selectDepartamento.required = true;
    ['Operaciones', 'Administración', 'Ventas', 'Marketing', 'RRHH', 'Finanzas', 'TI', 'Legal'].forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        selectDepartamento.appendChild(option);
    });
    selectDepartamento.onchange = () => actualizarTotales();
    tdDepartamento.appendChild(selectDepartamento);
    
    // Celda de responsable
    const tdResponsable = document.createElement('td');
    const inputResponsable = document.createElement('input');
    inputResponsable.type = 'text';
    inputResponsable.className = 'form-control';
    inputResponsable.placeholder = 'Nombre del responsable';
    inputResponsable.required = true;
    inputResponsable.onchange = () => actualizarTotales();
    tdResponsable.appendChild(inputResponsable);
    
    // Celda de acciones
    const tdAcciones = document.createElement('td');
    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn btn-danger';
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.onclick = () => {
        tr.remove();
        actualizarTotales();
    };
    tdAcciones.appendChild(btnEliminar);
    
    // Agregar todas las celdas a la fila
    tr.appendChild(tdDescripcion);
    tr.appendChild(tdMonto);
    tr.appendChild(tdFrecuencia);
    tr.appendChild(tdDepartamento);
    tr.appendChild(tdResponsable);
    tr.appendChild(tdAcciones);
    
    // Agregar fila a la tabla
    tbody.appendChild(tr);
}

function calcularTotal(tipo) {
    const tbody = document.querySelector(`#tabla-${tipo} tbody`);
    const filas = tbody.getElementsByTagName('tr');
    let total = 0;
    let costosPorDepartamento = {};
    let costosPorFrecuencia = {};
    
    for (let fila of filas) {
        const monto = parseFloat(fila.children[1].querySelector('input').value) || 0;
        const departamento = fila.children[3].querySelector('select').value;
        const frecuencia = fila.children[2].querySelector('select').value;
        
        total += monto;
        
        // Acumular por departamento
        costosPorDepartamento[departamento] = (costosPorDepartamento[departamento] || 0) + monto;
        
        // Acumular por frecuencia
        costosPorFrecuencia[frecuencia] = (costosPorFrecuencia[frecuencia] || 0) + monto;
    }
    
    return {
        total,
        costosPorDepartamento,
        costosPorFrecuencia
    };
}

function actualizarTotales() {
    // Calcular totales por tipo con información adicional
    const directos = calcularTotal('directos');
    const indirectos = calcularTotal('indirectos');
    const fijos = calcularTotal('fijos');
    const variables = calcularTotal('variables');
    
    // Actualizar totales en las tablas
    document.getElementById('total-directos').textContent = formatMoney(directos.total);
    document.getElementById('total-indirectos').textContent = formatMoney(indirectos.total);
    document.getElementById('total-fijos').textContent = formatMoney(fijos.total);
    document.getElementById('total-variables').textContent = formatMoney(variables.total);
    
    // Actualizar resumen
    document.getElementById('resumen-directos').textContent = formatMoney(directos.total);
    document.getElementById('resumen-indirectos').textContent = formatMoney(indirectos.total);
    document.getElementById('resumen-fijos').textContent = formatMoney(fijos.total);
    document.getElementById('resumen-variables').textContent = formatMoney(variables.total);
    
    // Calcular y actualizar total general
    const totalGeneral = directos.total + indirectos.total + fijos.total + variables.total;
    document.getElementById('resumen-total').textContent = formatMoney(totalGeneral);
    
    // Actualizar gráficos y análisis con la información adicional
    actualizarGrafico(directos, indirectos, fijos, variables);
}

function actualizarGrafico(directos, indirectos, fijos, variables) {
    const ctx = document.getElementById('costosChart').getContext('2d');
    const ctxBarras = document.getElementById('costosBarrasChart').getContext('2d');
    
    // Destruir gráficos anteriores si existen
    if (costosChart) {
        costosChart.destroy();
    }
    if (costosBarrasChart) {
        costosBarrasChart.destroy();
    }
    
    // Crear gráfico circular
    costosChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Costos Directos', 'Costos Indirectos', 'Costos Fijos', 'Costos Variables'],
            datasets: [{
                data: [directos.total, indirectos.total, fijos.total, variables.total],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(230, 126, 34, 0.8)'
                ],
                borderColor: [
                    'rgba(52, 152, 219, 1)',
                    'rgba(46, 204, 113, 1)',
                    'rgba(155, 89, 182, 1)',
                    'rgba(230, 126, 34, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatMoney(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Crear gráfico de barras
    costosBarrasChart = new Chart(ctxBarras, {
        type: 'bar',
        data: {
            labels: ['Costos Directos', 'Costos Indirectos', 'Costos Fijos', 'Costos Variables'],
            datasets: [{
                label: 'Monto Mensual',
                data: [directos.total, indirectos.total, fijos.total, variables.total],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(230, 126, 34, 0.8)'
                ],
                borderColor: [
                    'rgba(52, 152, 219, 1)',
                    'rgba(46, 204, 113, 1)',
                    'rgba(155, 89, 182, 1)',
                    'rgba(230, 126, 34, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatMoney(value);
                        },
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatMoney(context.raw);
                        }
                    }
                }
            }
        }
    });

    // Actualizar interpretaciones con la información adicional
    actualizarInterpretaciones(directos, indirectos, fijos, variables);
}

function actualizarInterpretaciones(directos, indirectos, fijos, variables) {
    const total = directos.total + indirectos.total + fijos.total + variables.total;
    const interpretacionElement = document.getElementById('interpretacion-costos');
    
    // Cálculos avanzados
    const porcentajeDirectos = (directos.total / total * 100).toFixed(1);
    const porcentajeIndirectos = (indirectos.total / total * 100).toFixed(1);
    const porcentajeFijos = (fijos.total / total * 100).toFixed(1);
    const porcentajeVariables = (variables.total / total * 100).toFixed(1);
    const ratioFijoVariable = (fijos.total / variables.total).toFixed(2);
    const ratioDirectoIndirecto = (directos.total / indirectos.total).toFixed(2);
    
    let interpretacionHTML = '<div class="interpretacion-detallada">';
    
    // 1. Análisis Estructural de Costos
    interpretacionHTML += `
        <h3>1. Análisis Estructural de Costos</h3>
        <div class="analisis-seccion">
            <h4>1.1 Distribución por Tipo de Costo</h4>
            <ul>
                <li>Costos Directos: ${porcentajeDirectos}% del total (${formatMoney(directos.total)})
                    <ul>
                        <li>Impacto en el costo unitario: ${(directos.total/total * 100).toFixed(1)}%</li>
                        <li>Eficiencia operativa: ${porcentajeDirectos > 40 ? 'Óptima' : 'Requiere mejora'}</li>
                    </ul>
                </li>
                <li>Costos Indirectos: ${porcentajeIndirectos}% del total (${formatMoney(indirectos.total)})
                    <ul>
                        <li>Nivel de asignación: ${porcentajeIndirectos > 30 ? 'Alto' : 'Aceptable'}</li>
                        <li>Potencial de optimización: ${porcentajeIndirectos > 25 ? 'Significativo' : 'Limitado'}</li>
                    </ul>
                </li>
                <li>Costos Fijos: ${porcentajeFijos}% del total (${formatMoney(fijos.total)})
                    <ul>
                        <li>Grado de apalancamiento operativo: ${ratioFijoVariable > 1 ? 'Alto' : 'Bajo'}</li>
                        <li>Flexibilidad operativa: ${ratioFijoVariable > 1.5 ? 'Limitada' : 'Adecuada'}</li>
                    </ul>
                </li>
                <li>Costos Variables: ${porcentajeVariables}% del total (${formatMoney(variables.total)})
                    <ul>
                        <li>Control de costos: ${porcentajeVariables > 50 ? 'Requiere atención' : 'Bueno'}</li>
                        <li>Escalabilidad: ${porcentajeVariables > 60 ? 'Alta' : 'Moderada'}</li>
                    </ul>
                </li>
            </ul>
            
            <h4>1.2 Distribución por Departamento</h4>
            <ul>
                ${Object.entries(directos.costosPorDepartamento).map(([dept, monto]) => `
                    <li>${dept}: ${formatMoney(monto)} (${((monto/directos.total)*100).toFixed(1)}%)</li>
                `).join('')}
            </ul>
            
            <h4>1.3 Distribución por Frecuencia</h4>
            <ul>
                ${Object.entries(directos.costosPorFrecuencia).map(([freq, monto]) => `
                    <li>${freq}: ${formatMoney(monto)} (${((monto/directos.total)*100).toFixed(1)}%)</li>
                `).join('')}
            </ul>
        </div>
    `;

    // 2. Análisis de Eficiencia Operativa
    interpretacionHTML += `
        <h3>2. Análisis de Eficiencia Operativa</h3>
        <div class="analisis-seccion">
            <h4>2.1 Indicadores Clave</h4>
            <ul>
                <li>Ratio Fijo/Variable: ${ratioFijoVariable}
                    <ul>
                        <li>Interpretación: ${ratioFijoVariable > 1 ? 'Estructura rígida' : 'Estructura flexible'}</li>
                        <li>Impacto en el punto de equilibrio: ${ratioFijoVariable > 1.2 ? 'Alto' : 'Moderado'}</li>
                    </ul>
                </li>
                <li>Ratio Directo/Indirecto: ${ratioDirectoIndirecto}
                    <ul>
                        <li>Eficiencia en asignación: ${ratioDirectoIndirecto > 1.5 ? 'Óptima' : 'Requiere mejora'}</li>
                        <li>Control de costos: ${ratioDirectoIndirecto > 1 ? 'Bueno' : 'Necesita atención'}</li>
                    </ul>
                </li>
            </ul>
        </div>
    `;

    // 3. Análisis de Riesgos y Oportunidades
    interpretacionHTML += `
        <h3>3. Análisis de Riesgos y Oportunidades</h3>
        <div class="analisis-seccion">
            <h4>3.1 Evaluación de Riesgos</h4>
            <ul>
                ${porcentajeFijos > 40 ? `
                <li>Riesgo de Costos Fijos Elevados
                    <ul>
                        <li>Impacto en la flexibilidad operativa: Alto</li>
                        <li>Vulnerabilidad a cambios en el volumen: Significativa</li>
                        <li>Necesidad de capital de trabajo: Mayor</li>
                    </ul>
                </li>` : ''}
                ${porcentajeVariables > 60 ? `
                <li>Riesgo de Control de Costos Variables
                    <ul>
                        <li>Dependencia de precios de insumos: Alta</li>
                        <li>Impacto de fluctuaciones del mercado: Significativo</li>
                        <li>Necesidad de sistemas de control: Crítica</li>
                    </ul>
                </li>` : ''}
                ${porcentajeIndirectos > 30 ? `
                <li>Riesgo de Costos Indirectos
                    <ul>
                        <li>Complejidad en la asignación: Alta</li>
                        <li>Riesgo de sub-asignación: Significativo</li>
                        <li>Impacto en la rentabilidad: Considerable</li>
                    </ul>
                </li>` : ''}
            </ul>
        </div>
    `;

    // 4. Recomendaciones Estratégicas
    interpretacionHTML += `
        <h3>4. Recomendaciones Estratégicas</h3>
        <div class="analisis-seccion">
            <h4>4.1 Optimización de Costos</h4>
            <ul>
                ${porcentajeFijos > 40 ? `
                <li>Estrategias para Costos Fijos
                    <ul>
                        <li>Implementar sistema de costos ABC para mejor asignación</li>
                        <li>Evaluar outsourcing de servicios no críticos</li>
                        <li>Desarrollar planes de reducción gradual de costos fijos</li>
                        <li>Considerar arrendamiento operativo vs. compra de activos</li>
                    </ul>
                </li>` : ''}
                ${porcentajeVariables > 60 ? `
                <li>Estrategias para Costos Variables
                    <ul>
                        <li>Implementar sistema de control de inventarios just-in-time</li>
                        <li>Desarrollar programa de mejora continua en procesos</li>
                        <li>Establecer alianzas estratégicas con proveedores</li>
                        <li>Crear sistema de incentivos por eficiencia operativa</li>
                    </ul>
                </li>` : ''}
                ${porcentajeIndirectos > 30 ? `
                <li>Estrategias para Costos Indirectos
                    <ul>
                        <li>Implementar sistema de costeo por actividades</li>
                        <li>Optimizar procesos administrativos</li>
                        <li>Desarrollar indicadores de eficiencia por departamento</li>
                        <li>Establecer presupuestos por responsabilidad</li>
                    </ul>
                </li>` : ''}
            </ul>
        </div>
    `;

    // 5. Proyecciones y Escenarios
    interpretacionHTML += `
        <h3>5. Proyecciones y Escenarios</h3>
        <div class="analisis-seccion">
            <h4>5.1 Análisis de Escenarios</h4>
            <ul>
                <li>Escenario Optimista
                    <ul>
                        <li>Reducción potencial de costos: ${(Math.min(porcentajeIndirectos, porcentajeFijos) * 0.15).toFixed(1)}%</li>
                        <li>Mejora en eficiencia operativa: ${(porcentajeVariables * 0.1).toFixed(1)}%</li>
                        <li>Impacto en rentabilidad: Positivo</li>
                    </ul>
                </li>
                <li>Escenario Moderado
                    <ul>
                        <li>Mantenimiento de estructura actual</li>
                        <li>Enfoque en control y monitoreo</li>
                        <li>Impacto en rentabilidad: Neutral</li>
                    </ul>
                </li>
                <li>Escenario Pesimista
                    <ul>
                        <li>Incremento potencial de costos: ${(Math.max(porcentajeFijos, porcentajeVariables) * 0.1).toFixed(1)}%</li>
                        <li>Deterioro en eficiencia: ${(porcentajeDirectos * 0.05).toFixed(1)}%</li>
                        <li>Impacto en rentabilidad: Negativo</li>
                    </ul>
                </li>
            </ul>
        </div>
    `;

    // 6. Plan de Acción Inmediato
    interpretacionHTML += `
        <h3>6. Plan de Acción Inmediato</h3>
        <div class="analisis-seccion">
            <h4>6.1 Acciones Prioritarias</h4>
            <ul>
                <li>Corto Plazo (1-3 meses)
                    <ul>
                        <li>Implementar sistema de control diario de costos variables</li>
                        <li>Iniciar proceso de revisión de costos indirectos</li>
                        <li>Establecer indicadores clave de rendimiento (KPIs)</li>
                    </ul>
                </li>
                <li>Mediano Plazo (3-6 meses)
                    <ul>
                        <li>Desarrollar programa de optimización de procesos</li>
                        <li>Implementar sistema de costeo por actividades</li>
                        <li>Establecer alianzas estratégicas con proveedores</li>
                    </ul>
                </li>
                <li>Largo Plazo (6-12 meses)
                    <ul>
                        <li>Reestructurar modelo de negocio si es necesario</li>
                        <li>Implementar sistema integral de gestión de costos</li>
                        <li>Desarrollar programa de mejora continua</li>
                    </ul>
                </li>
            </ul>
        </div>
    `;

    interpretacionHTML += '</div>';
    interpretacionElement.innerHTML = interpretacionHTML;
}

// Inicializar la página
window.onload = function() {
    actualizarTotales();
}; 