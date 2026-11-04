<?php
// Demo content for the Mansa Vet theme: services, team, menus. Idempotent enough for a fresh site.
require_once '/wordpress/wp-load.php';
$services = array(
	array( 'Consulta clínica', 'Avaliação completa, sem pressa, com tempo para as suas perguntas.', 'R$ 140', 'Consultas de 40 minutos com explicação de cada passo e plano de cuidado por escrito.' ),
	array( 'Vacinas e prevenção', 'Calendário sob medida para filhotes, adultos e idosos.', 'R$ 95', 'Protocolos de vacinação, vermifugação e controle de pulgas e carrapatos.' ),
	array( 'Exames no mesmo dia', 'Sangue, ultrassom e raio-X com laudo rápido.', 'R$ 110', 'Laboratório e imagem na própria clínica, para você sair daqui com respostas.' ),
	array( 'Cirurgia e castração', 'Centro cirúrgico com monitoramento anestésico.', 'R$ 480', 'Procedimentos eletivos e de rotina com acompanhamento no pós-operatório.' ),
	array( 'Odontologia veterinária', 'Limpeza, extrações e cuidado com a saúde bucal.', 'R$ 320', 'Tártaro e gengivite afetam o coração e os rins. Cuidamos disso com anestesia segura.' ),
	array( 'Urgência 24h', 'Plantão todos os dias, inclusive feriados.', 'R$ 220', 'Atendimento imediato com triagem por gravidade e equipe sempre de prontidão.' ),
);
foreach ( $services as $i => $s ) {
	wp_insert_post( array( 'post_type' => 'servico', 'post_status' => 'publish', 'post_title' => $s[0], 'post_excerpt' => $s[1], 'post_content' => '<p>' . $s[3] . '</p>', 'menu_order' => $i, 'meta_input' => array( 'mansa_price_from' => $s[2] ) ) );
}
$team = array(
	array( 'Dra. Helena Duarte', 'Clínica geral · CRMV-PR 00000', 'Fundadora. Atende com calma e senta no chão com os pets mais assustados.' ),
	array( 'Dr. Rafael Moura', 'Cirurgia · CRMV-PR 00000', 'Cirurgião com foco em procedimentos minimamente invasivos e recuperação tranquila.' ),
	array( 'Dra. Iara Campos', 'Felinos · CRMV-PR 00000', 'Medicina felina e ambientes livres de estresse para gatos.' ),
	array( 'Dr. Tomás Veiga', 'Diagnóstico por imagem · CRMV-PR 00000', 'Ultrassom e raio-X com laudo no mesmo dia.' ),
);
foreach ( $team as $i => $t ) {
	wp_insert_post( array( 'post_type' => 'profissional', 'post_status' => 'publish', 'post_title' => $t[0], 'post_content' => $t[2], 'menu_order' => $i, 'meta_input' => array( 'mansa_role' => $t[1] ) ) );
}
$menu_id = wp_create_nav_menu( 'Principal' );
foreach ( array( 'Serviços' => '/#servicos', 'Equipe' => '/#equipe', 'Histórias' => '/#depoimentos', 'Contato' => '/#contato' ) as $label => $path ) {
	wp_update_nav_menu_item( $menu_id, 0, array( 'menu-item-title' => $label, 'menu-item-url' => home_url( $path ), 'menu-item-status' => 'publish', 'menu-item-type' => 'custom' ) );
}
set_theme_mod( 'nav_menu_locations', array( 'primary' => $menu_id, 'footer' => $menu_id ) );
update_option( 'blogname', 'Mansa Clínica Veterinária' );
update_option( 'blogdescription', 'Cuidado de verdade para cães, gatos e pets exóticos em Curitiba' );
update_option( 'permalink_structure', '/%postname%/' );
flush_rewrite_rules();
update_option( 'sidebars_widgets', array( 'footer-notice' => array() ) );
